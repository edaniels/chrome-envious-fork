chrome.storage.sync.get({
    match: 'https://example.com',
    replace: 'http://127.0.0.1:80',
    compressed: false
}, items => {

    const { match, replace, compressed } = items
    const replaceURL = new URL(replace);
    const replaceURLBase = `${replaceURL.protocol}//${replaceURL.hostname}`;
    const likelyMMSURL = `${replaceURL.protocol}//${replaceURL.hostname}:8080`;
    const isCompressed = compressed === 'true';

    // redirect requests for matching URLs
    chrome.webRequest.onBeforeRequest.addListener(
        info => {
          // show page action icon
          chrome.pageAction.show(info.tabId)

          const jsRegex =
            /(account|admin|auth|main|project|ecosystem)(\.[a-fA-F0-9]*)(\.js)$/;
          const cssRegex = /(\.[a-fA-F0-9]*)(\.min)*(\.css)$/;
          const jsRegexReplace = isCompressed ? "$1.min$3": "$1$3";

          let redirectUrl = info.url;
           
          let anyMatch = false;
          if (redirectUrl.match(cssRegex)) {
            anyMatch = true;
            redirectUrl = redirectUrl
              .replace(cssRegex, "$2$3")
              .replace(match, likelyMMSURL);
            if (isCompressed) {
              redirectUrl = redirectUrl.replace(".min.", ".");
            }
          } else if (redirectUrl.match(jsRegex)) {
            anyMatch = true;
            redirectUrl = redirectUrl
              .replace(jsRegex, jsRegexReplace)
              .replace(match, replace);
            if (!isCompressed) {
              redirectUrl = redirectUrl.replace(".min.", ".");
            }
          } else {
            redirectUrl = redirectUrl
              .replace(match, replace);
          }


          if (redirectUrl === info.url) {
            return;
          }
          console.log({from: info.url, to: redirectUrl});
          return {redirectUrl};
        },
        {
            urls: [`${match}/*.js`, `${match}/*.css`],
        },
        ['blocking','extraHeaders']
    ),

    // ensure all requests to target domain have an open CORS response
    // header and allow-headers for x-requested-with for XHR requests
    chrome.webRequest.onHeadersReceived.addListener(
        info => {
          if (!info.url.startsWith(replaceURLBase)) {
            return;
          }
          const responseHeaders = info.responseHeaders.filter(({name}) => {
            const nameLower = name.toLowerCase();
            if (nameLower === 'access-control-allow-origin' ||
                nameLower === 'access-control-allow-headers') {
              return false;
            }
            return true;
          })

          responseHeaders.push(
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Access-Control-Allow-Headers', value: '*' }
          )
          return { responseHeaders }
        },
        {
            urls: [ `<all_urls>` ]
        },
        ['blocking', 'responseHeaders', chrome.webRequest.OnHeadersReceivedOptions.EXTRA_HEADERS]
    )
})

