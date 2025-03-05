const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const { portaffFunction } = require('./afflinker.js');
const app = express();
const PORT = 3100;

// ✨ عنوان الويب هوك الخاص بك
const WEBHOOK_URL = 'https://yout_link.com/webhook';

app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ✅ عند مسح رمز QR بنجاح
client.on('qr', qr => {
    console.log('📌 قم بمسح رمز QR لتسجيل الدخول:');
    qrcode.generate(qr, { small: true });
});

// ✅ عند تسجيل الدخول
client.on('ready', () => {
    console.log('✅ البوت جاهز للعمل!');
});

// 📩 استقبال الرسائل ومعالجتها
client.on('message', async message => {
    console.log(`📩 رسالة مستلمة: ${message.body}`);

    try {
        await axios.post(WEBHOOK_URL, {
            from: message.from,
            body: message.body,
            timestamp: message.timestamp,
            type: message.type
        });

        console.log('✅ تم إرسال البيانات إلى Webhook');
    } catch (error) {
        console.error('❌ فشل إرسال البيانات إلى Webhook:', error.message);
    }

    if (message.body.toLowerCase() === 'start') {
        await client.sendMessage(message.from, '🎉 مرحبا بك في بوت تخفيض الأسعار! \n\nأرسل رابط المنتج للحصول على تخفيضات النقاط والسوبر والعروض المحدودة.');
        return;
    }

    try {
        // 📌 استخراج الروابط من النص
        const extractLinks = (text) => {
            const urlPattern = /https?:\/\/[^\s]+/g;
            return text.match(urlPattern) || [];
        };

        // 📌 استخراج معرف المنتج من الرابط
        const idCatcher = async (url) => {
            if (/^\d+$/.test(url)) return url;
            if (!url.includes("aliexpress.com")) return null;

            try {
                const response = await axios.head(url, { maxRedirects: 0, validateStatus: status => status >= 200 && status < 400 });
                const decodedUrl = decodeURIComponent(response.headers.location);
                const match = decodedUrl.match(/\/(\d+)\.html/);
                return match ? match[1] : null;
            } catch (error) {
                console.error('❌ خطأ في جلب الرابط:', error);
                return null;
            }
        };

        await client.sendMessage(message.from, '⌛ انتظر قليلاً، جاري البحث عن التخفيضات...');

        const links = extractLinks(message.body);
        if (links.length === 0) {
            await client.sendMessage(message.from, '❌ لم يتم العثور على رابط صالح. الرجاء إرسال رابط AliExpress.');
            return;
        }

        let productUrl = links[0].includes("https") ? links[0] : `https${links[0].split("http")[1]}`;
        const productId = await idCatcher(productUrl);
       
        if (!productId) {
            await client.sendMessage(message.from, '❌ لم يتم العثور على معرف المنتج. تأكد من صحة الرابط.');
            return;
        }

        const coinPi = await portaffFunction(cookis, productId);
        console.log(coinPi);
        const media = await MessageMedia.fromUrl(coinPi.info.normal.image);
        await client.sendMessage(message.from, media, {
            caption: `🔖 *${coinPi.info.normal.name}*
⭐ التقييم: ${coinPi.info.normal.rate} ⭐ (${coinPi.info.normal.totalRates} تقييم)
🛒 المتجر: ${coinPi.info.normal.store} (${coinPi.info.normal.storeRate} ⭐)
🚚 الشحن: ${coinPi.info.normal.shipping}
🎯 *التخفيضات:*
🌟رابط تخفيض النقاط:${coinPi.info.points.discountPrice}
${coinPi.aff.points}
🔥 رابط تخفيض السوبر: ${coinPi.info.super.price}
${coinPi.aff.super}
📌رابط العرض المحدود: ${coinPi.info.limited.price}
${coinPi.aff.limited}`
        });


        // ✅ حذف آخر رسالة من البوت
        const chat = await message.getChat();
        const messages = await chat.fetchMessages({ limit: 5 });

        for (let msg of messages) {
            if (msg.fromMe) {
                await msg.delete();
                console.log('🗑️ تم حذف الرسالة القديمة!');
                break;
            }
        }

    } catch (error) {
        console.error('❌ خطأ:', error);
        await client.sendMessage(message.from, '❌ حدث خطأ أثناء جلب البيانات. حاول مرة أخرى لاحقاً.');
    }
});

// ✅ إعادة تشغيل العميل عند الانفصال
client.on('disconnected', (reason) => {
    console.error('❌ تم فصل الاتصال:', reason);
    console.log('🔄 إعادة تشغيل البوت...');
    client.initialize();
});

app.listen(PORT, () => {
    console.log(`🚀 Webhook server يعمل على http://localhost:${PORT}`);
});

client.initialize();
