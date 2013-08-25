chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var gistUrlMatch = tab.url.match(/gist.github.com\/.*?\/(\d+)/)
    var gistId = gistUrlMatch && gistUrlMatch[1]
    if (gistId) {
        chrome.pageAction.show(tabId);
    }
});

chrome.pageAction.onClicked.addListener(function(tab) {
    var gistUrlMatch = tab.url.match(/gist.github.com\/.*?\/(\d+)/)
    var gistId = gistUrlMatch && gistUrlMatch[1]
    if (!gistId) {
        alert('Make sure you are viewing a gist on github.')
        return
    }

    console.warn('gistId', gistId)
    $.ajax({
        url: 'https://api.github.com/gists/' + gistId
    })
    .done(function(response) {
        var gist = response
        console.log('gist',gist)
        if (gist.files['index.html']) {
            var evals = []
            var html = gist.files['index.html'].content
                // Inline relative stylesheets
                .replace(/<link\s+.*?href\s*=\s*['"](.*?)['"].*?\/.*?>/g, function(str, url) {
                    if (gist.files[url]) {
                        var content = gist.files[url].content
                        console.warn('Replace link', str, 'with', '<style>' + content + '</style>')
                        return '<style>' + content + '</style>'
                    }
                    return str
                })
                // Inline relative scripts
                .replace(/(<script\s+.*?)src\s*=\s*['"](.*?)['"](.*?>.*?<\/script>)/g, function(str, prefix,url,suffix) {
                    if (gist.files[url]) {
                        var content = gist.files[url].content
                        evals.push(content)
                        console.warn('Replace src', str, 'with', prefix + suffix + content)
                        return ''
                    }
                    return str
                })
                // Replace relative urls with raw_url
                .replace(/(href=['"])(.*?)(['"])/g, function(str, prefix, url, suffix) {
                    if (gist.files[url]) {
                        console.warn('Replace href',url,'with', prefix + gist.files[url].raw_url + suffix)
                        return prefix + gist.files[url].raw_url + suffix
                    }
                    return str
                })
            console.log(html)
            chrome.tabs.create({
                active:false,

                // Workaround for about:blank limitation
                // See https://code.google.com/p/chromium/issues/detail?id=77947
                url: chrome.extension.getURL('blank.html')
            }, function(newBrowserTab) {
                chrome.tabs.sendMessage(newBrowserTab.id, {type: 'setDocumentContent', html:html, evals:evals})
            })
        } else {
            alert('Gist must have index.html')
        }
    })
    .fail(function() {
        alert('Failed to fetch gist: ' + gistId)
    })
});
