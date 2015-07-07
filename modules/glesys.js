'use strict';
var request = require( 'request' ),
    moment = require( 'moment' ),
    chalk = require( 'chalk' );

module.exports = {
    apiBase: 'api.glesys.com/',
    apiKey: false,
    account: false,
    servers: [],
    responsetimes : [],
    maxResponetimesStored: 360, // 6 hours
    loadPath: function( path, callback, parameters ){
        var options = {
                url: this.buildUrl( path, parameters ),
                json: true,
                timeout: 5000
            },
            _this = this,
            starttime = new Date().getTime(),
            endtime = 0;

        return request( options , function( error, response, body ){
            var timeLabel = moment().format( 'HH:mm' );

            if( error ){
                // Handle errors perpahs?
                // Right now we don't wanna do anything with this, we just want
                // to wait for the next request and hope that doesn't fail

                //console.log( error );
           } else {
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

                if( response.statusCode == 200 ){
                    callback.call( _this, body );
                } else if( response.statusCode == 401 ){
                    callback.call( _this, {
                        status: 'failed',
                        message: body.response.status.text
                    });
                }
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
