const axios = require('axios');
const portaffFunction = async (cookie, id) => {
    const sourceTypes = ["620", "562", "561"];
    let result = { aff: {}, info: {}, previews: [] };
    let links;

    // إنشاء الروابط المطلوبة
    const promotionLinkRequests = sourceTypes.map(sourceType => {

        links = `https://star.aliexpress.com/share/share.htm?redirectUrl=https%3A%2F%2Fvi.aliexpress.com%2Fitem%2F${id}.html%3FsourceType%3D${sourceType === "620" ? '620%26channel%3Dcoin' : sourceType}&aff_fcid=`;
        // links = `https://star.aliexpress.com/share/share.htm?redirectUrl=https://vi.aliexpress.com/item/${id}.html,https://star.aliexpress.com/share/share.htm?redirectUrl=https://vi.aliexpress.com/item/${id}.html?sourceType=620&channel=coin&aff_fcid=,https://star.aliexpress.com/share/share.htm?redirectUrl=https://vi.aliexpress.com/item/${id}.html?sourceType=562&aff_fcid=,https://star.aliexpress.com/share/share.htm?redirectUrl=https://vi.aliexpress.com/item/${id}.html?sourceType=561&aff_fcid=,https://star.aliexpress.com/share/share.htm?redirectUrl=https://vi.aliexpress.com/item/${id}.html?sourceType=680&aff_fcid=,https://star.aliexpress.com/share/share.htm?redirectUrl=https://vi.aliexpress.com/item/${id}.html?sourceType=570&aff_fcid=`


        return axios.get("https://portals.aliexpress.com/tools/linkGenerate/generatePromotionLink.htm", {
            params: {
                trackId: 'default',
                targetUrl: links,
            },
            headers: { "cookie": `intl_common_forever=fPwGW+4bNSR1omL8O4BaGSi9fAsTXSoQhG4wnyF3dlSq1FLtgZSExw==; xman_t=${cookie}; epssw=1*GDhs11ik450qZbGSuzzSER2GNYMsElDjTJjWRaG3x1BljG4SNRVWIRqQgI63d3jGPfV4Z5IhiSgS7RGmbspzMPy2NcGd9bVcH9626T_kAQwAjtn1FJ626TTChbOkd14Ee7H2NC6B3Q9fdt50acjMj-FxL9rphJPygGobGTyZHGxMjB6gwJ9Y_2JbxYM8xDDF3DqnetyR38BqxkBpevp8HE_8y8B4etzRysmkRpXdGCNGhABR3864dLnnxvO.; x-hng=lang=en-US;_ga_VED1YSGNC7=GS1.1.1717020972.78.1.1717021041.60.0.0; acs_usuc_t=x_csrf=og7v9h7_n782&acs_rt=52f2d555ff164ae1b0cf6551097aecdc; xlly_s=1; JSESSIONID=826CBDCB5C1D2F87F1062F77BE0392AC;isg=BLq615eFiGqEWgd3ybIF52plC-Dcaz5FoRVhIMSxHs0Yt1zxr_irVMyBB1trJ7bd` }
        });
    });

    const infoRequest = axios.get(`ApiGetInfoProduct`);

    const responses = await Promise.allSettled([...promotionLinkRequests, infoRequest]);


    // التعامل مع ردود الرابط الترويجي
    responses.slice(0, 3).forEach((response, index) => {
        if (response.status === 'fulfilled') {
            switch (index) {
                case 0:
                    result.aff.points = response.value.data.data;
                    break;
                case 1:
                    result.aff.super = response.value.data.data;
                    break;
                case 2:
                    result.aff.limited = response.value.data.data;
                    break;

            }
        } else {
            result.aff = {
                points: null,
                super: null,
                limited: null,
                bigsave: null
            };
        }
    });

    // التعامل مع رد الـ info
    const infoResponse = responses[3];
    if (infoResponse.status === 'fulfilled') {
        result.info = infoResponse.value.data;
    } else {
        result.error = "Unable to fetch data from the info API. Promotion links are available.";
    }


    return result;
};

exports.portaffFunction = portaffFunction;
;