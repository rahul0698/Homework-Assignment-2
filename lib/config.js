/*
* all app configuration declared here
*
*/


//Defining config
var config = {
    httpPort: 3000,
    envName: 'staging',
    hashingSecret:'nodeAssignment2',
    'stripe' : {
        'key':'sk_test_vLeFMMNPX1gF3fjwZysQPQY5'
    },
    mailgun: {
        auth: '5bf87a9ddc9b77870da329521c218012-a5d1a068-2a388c90',
        path: 'v3/sandbox83b0e645600b40d3a562e4a08678f56f.mailgun.org',
        sender: 'bunny1292@gmail.com'
    }
};

// export the module
module.exports = config;