'use strict';

var sshClient = require( 'ssh2' ).Client;
var remotelog = function(){};

remotelog.prototype.serverName = false;
remotelog.prototype.domain = false;
remotelog.prototype.username = false;
remotelog.prototype.password = false;

remotelog.prototype.callbackMethod = false;
remotelog.prototype.logCommand = 'tail -f /var/log/apache2/error.log -n 0';

remotelog.prototype.getDateTime = function() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    /*
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
    */

    return hour + ":" + min;
};

remotelog.prototype.connect = function(){
    var connection = new sshClient(),
        _this = this;

    connection.on( 'ready', function() {
        _this.handleMessage( 'Connected' );
        connection.shell( function( error, stream ) {
            if( error ) {
                throw error;
            }

            stream.on( 'close', function() {
                _this.handleMessage( 'Disconnected' );
                connection.end();
            }).on( 'data', function( data ) {
                _this.handleMessage( data );
            }).stderr.on( 'data', function( data ) {
                console.log( 'STDERR: ' + data );
            });

            stream.end( _this.logCommand + '\n' );
        });
    })
    .on( 'error', function( error ){
        // handle errors?
        //console.log( 'got error' );
        _this.handleMessage( error );
    })
    .on( 'end', function(){
        //console.log( 'got end' );
        _this.handleMessage( 'Disconnected' );
    })
    .on( 'close', function( hadError ){
        var message = 'Connection closed';

        if( hadError ){
            message = message + ' due to an error.';
        }

        _this.handleMessage( message );
    })
    .connect( {
        host: _this.serverName + '.' + _this.domain,
        port: 22,
        username: _this.username,
        password: _this.password,
        keepaliveInterval: 30000
    } );
};

remotelog.prototype.handleMessage = function( message ){
    var string = '' + message;

    if( string.indexOf( this.logCommand ) !== -1 ){
        return false;
    }

    // Starts with Welcome to Ubuntu, probably a welcome message
    if( string.indexOf( 'Welcome to Ubuntu' ) === 0 ){
        return false;
    }

    // Starts with user@server. Probably not something from the remote log
    if( string.indexOf( this.username + '@' + this.serverName ) === 0 ){
        return false;
    }

    if( string.indexOf( ']' ) !== false ) {
        string = string.substr( string.lastIndexOf( ']' ) + 1 ).trim();
    }

    string = '[' + this.serverName + '] ' + string;

    string = this.getDateTime() + ' ' + string;

    this.callbackMethod( string );
};

module.exports = remotelog;
