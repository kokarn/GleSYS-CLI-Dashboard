'use strict';
var request = require( 'request' ),
    moment = require( 'moment' ),
    chalk = require( 'chalk' ),
    settings;

try {
    settings = require( './settings.js' );
} catch( error ){
    console.log( chalk.red( 'Failed to load settings. Please run "node credentials.js" ' ) );
    process.exit();
}

module.exports = {
    apiBase: 'api.glesys.com/',
    apiKey: settings.glesysApiKey,
    account: settings.glesysAccount,
    servers: [],
    responsetimes : [],
    maxResponetimesStored: 360, // 6 hours
    loadPath: function( path, callback, parameters ){
        var options = {
                url: this.buildUrl( path, parameters ),
                json: true
            },
            _this = this,
            starttime = new Date().getTime(),
            endtime = 0;

        return request( options , function( error, response, body ){
            var timeLabel = moment().format( 'HH:mm' );
            endtime = new Date().getTime();

            if( !_this.responsetimes.some(
                function( element ){
                    return element.label == timeLabel;
                })
            ){
                _this.responsetimes.push( {
                    label: timeLabel,
                    data: endtime - starttime
                });
            }

            _this.responsetimes = _this.responsetimes.slice( - _this.maxResponetimesStored );

            if( error ){
               console.log( error );
               console.log( response );
            } else if( response.statusCode == 200 ){
                callback.call( _this, body );
            } else if( response.statusCode == 401 ){
                callback.call( _this, {
                    status: 'failed',
                    message: body.response.status.text
                });
            }
        });
    },
    buildUrl: function( path, parameters ){
        var url = 'https://' + this.account + ':' + this.apiKey + '@' + this.apiBase + path;

        if( parameters !== undefined && parameters.serverid !== undefined ){
            url = url + '/serverid' + '/' + parameters.serverid;
        }

        url = url + '/format/json';

        return url;
    },
    getServerList: function( callback ){
        this.loadPath( 'server/list', function( data ){
            var responseData;
            if( data.response !== undefined && data.response.servers !== undefined ){
                this.servers = data.response.servers;
                responseData = this.servers;
            } else {
                responseData = data;
            }

            callback.call( this, responseData );
        } );
    },
    getServerStatus: function( server, callback ){
        this.loadPath( 'server/status', function( data ){
                callback.call( this, data );
            },
            {
                'serverid': server
            }
        );
    }
};
