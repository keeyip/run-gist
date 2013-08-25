chrome.runtime.onMessage.addListener(function(message) {
    console.warn(message)
    var HANDLERS = {
        setDocumentContent: function() {
            document.open('text/html')
            document.write(message.html)
            document.close()
            window.onload = function() {
                var evals = message.evals
                var fn
                for (var i=0, n=evals.length; i < n; i++) {
                    fn = new Function(evals[i])
                    console.warn('Eval', fn.toString())
                    fn.call(this)
                }
            }
        }
    }

    var handler = HANDLERS[message.type]
    if (handler) {
        handler()
    }
});
