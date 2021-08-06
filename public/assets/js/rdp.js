const activatePost = async postID => {
    const response = await fetch('/admin/rpd', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            postID
        })
    });
    const resJSON = await response.json();
    if (resJSON.status !== 'success') {
        myAlert(resJSON.message);
    }
}