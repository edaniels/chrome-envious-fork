document.addEventListener('DOMContentLoaded', () => {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        match: 'https://example.com',
        replace: 'http://127.0.0.1:80',
        compressed: false
    }, items => {
        document.querySelector('input[name=match]').value = items.match
        document.querySelector('input[name=replace]').value = items.replace
        document.querySelector('input[name=compressed]').value = items.compressed
    })

    const getInput = name => document.querySelector(`input[name=${name}]`).value

    document.querySelector('button[name=save]').addEventListener('click', () => {
        chrome.storage.sync.set({
            match: getInput('match'),
            replace: getInput('replace'),
            compressed: getInput('compressed')
        }, chrome.runtime.reload)
    })
})
