'use strict';
var request = require( 'request' ),
    moment = require( 'moment' ),
    chalk = require( 'chalk' ),
    settings;

try {
    settings = require( './lib/settings.js' );
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
    maxResponetimesStored: 3600,
    loadPath: function( path, callback, parameters ){
        var options = {
            'url': this.buildUrl( path, parameters ),
            'json': true
        },
        _this = this,
        starttime = new Date().getTime(),
        endtime = 0;

        return request( options , function( error, response, body ){
            var timeLabel = moment().format( 'HH:mm:ss' );
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

            if( !error && response.statusCode == 200 ){
                callback.call( _this, body );
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
            this.servers = data.response.servers;
            callback.call( this, this.servers );
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
