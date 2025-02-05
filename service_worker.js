chrome.storage.sync
  .get({
    match: "https://my-source.com",
    replace: "http://localhost:8080",
    compressed: false,
  })
  .then(async ({ match, replace, compressed }) => {
    // Bring these back when we fix css
    // const replaceURL = new URL(replace);
    // const urlWithDefaultPort = `${replaceURL.protocol}//${replaceURL.hostname}:8080`;

    const responseHeaders = [
      { header: "Access-Control-Allow-Origin", operation: "set", value: "*" },
      { header: "Access-Control-Allow-Headers", operation: "set", value: "*" },
    ];

    const isCompressed = compressed === "true";

    const jsRegex = `(account|admin|auth|main|project|ecosystem)(\.[a-fA-F0-9]*)${
      isCompressed ? ".min" : ""
    }(\.js)$`;
    const cssRegex = `(\.[a-f0-9]{10})(?:\.min)?(\.css)`;

    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map((rule) => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: [
        {
          // CSS is borked for now due to CORS - just don't rip it out yet
          // id: 1,
          // action: {
          //   type: "redirect", // css
          //   redirect: {
          //     regexSubstitution: `${urlWithDefaultPort}\\1\\3`,
          //   },
          // },
          condition: {
            regexFilter: `${match}(.*)${cssRegex}`,
            resourceTypes: ["stylesheet", "xmlhttprequest"],
          },
        },
        {
          id: 2,
          action: {
            type: "redirect", // js
            redirect: {
              regexSubstitution: `${replace}\\1\\2\\4`,
            },
          },
          condition: {
            regexFilter: `${match}(.*)${jsRegex}`,
            resourceTypes: ["script", "xmlhttprequest"],
          },
        },
        {
          id: 3,
          action: {
            type: "modifyHeaders",
            responseHeaders,
          },
          condition: {
            urlFilter: match,
            resourceTypes: ["script", "stylesheet", "xmlhttprequest", "other"],
          },
        },
      ],
    });
  });
