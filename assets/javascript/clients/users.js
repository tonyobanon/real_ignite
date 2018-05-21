
function getUserProfile() {
    var user_auth = getCookie('user_auth');
    if(!user_auth) {
        return Promise.reject();
    }
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/api/users/get-profile',
            data: {
                user_auth: user_auth
            }
        }).done(function (data) {
            resolve(data.data);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR.responseJSON);
            });
    }); 
}
