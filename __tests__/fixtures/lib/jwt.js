'use strict';

//let jwtToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOjM4MCwiaXNzIjoicmVhbF9pZ25pdGUiLCJpYXQiOjE1MjY0MTk5MDcsImV4cCI6MTUyNjUwNjMwN30.aGEVzdId0Cl7VmM2qXckw4njt9D5IVmXVf5nZk2hzwGDQsxjv3_NExapm2lA1Y4GlOcS1Q4pqC18jEZaQihS_E-DPPL2VZvQU64QxxwIJoBuL2m-3AYwTtejC7AjPMoJgPtlAULIOlM_ppqeSSbZsBjM2PO3fpEo7COi600LuvY';
let jwtToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJyZWFsX2lnbml0ZSIsImlhdCI6MTUyNjUxMzUxMCwiZXhwIjoxZSs4MX0.MwdyNMTJlGdSIdI-U1ssMio5nXs8FzXYJXSzCSFpnlg_hLN9kBC1KNf4gmsDJD6Jva8Q5BrT-aM_53cHBUSjtfxXJAr4Rg_4lQtT-dwoHG4zvKptSktdfA67WxgfWe_zcjTUcOAKTfwPkysmoOa4SgA-07y-LCNqZlw9F3qxv_Q';

let jwtIssuer = 'real_ignite';
let jwtTokenData = { jti: 380, iss: 'real_ignite'};

let invalidJwtToken = 'eyJhbGciOiJShmgjzUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdHkiOjc0NCwiaXNzIjoiaGFja2VyYmF5Iiwia' +
    'WF0IjoxNTEyMzYzMDQzDhgvTYKUuoVTFkgUG4NGQwYjVlYTZmMWZhMWViMGY4YmZiYTNlMWViZDVlYmQyYzk2NDIzYzAwZmQxZGQ' +
    '2NmE0MzlkNzU3YTJlNGZlOThhYzcwYzUyNDdjNGM1YWI5MDVmZDhiZmE5NTc1OGNiNjU0ZjcyMDc3YzA4ZDM5N2JjMWE0ZDA4ZGEzMy' +
    'IsImV4cCI6MTUxMjQ0OTQ0M30.NcqAF8V2EJ44HBoDVvkSzPgkVg92O-NEvpQm3bYxgyOW7bl7DUsnt84bZ1QvMQVGJsIgyK6G6y19-h' +
    'qDG_FcdfD5Sv6ilM7pzfT5CURJNSJn_5YIlR-Iac2nAIjPv6rVKAyfp53oiPHJVk_qPPCTCVRRXfHXYM8q2u65bqGTa0I';

module.exports = {
    jwtToken,
    jwtIssuer,
    jwtTokenData,
    invalidJwtToken
};
