const {clientOpen} = require('./client/index.js');

let closed = true;

const   tunnel = (env, ws_url, profile_name) => {
    let profile = env.profiles[profile_name];
    profile.closed = false;
    let hosts = env.host.split(':');
    //console.log('proxy', host, env.port, profile.localPort);
    let ws = clientOpen(profile.localPort, ws_url);
    profile.ws = ws;
    ws.on('open', () => {
        ws.Api('auth', {
                user: env.user,
                password:  env.password
            },
            (body) => {
                //console.log('body', body);
                if  ( body.status == 'OK')  {
                    session_id = body.id;
                    ws.Api('start', {
                            name: profile_name
                        },
                        (body) => {
                            if  ( body.status != 'OK')  {
                                console.log(`can not start ${profile_name}`);
                                console.log('error:', body.error);
                                ws.close();
                            } else {
                                //console.log(`start ${profile_name}`);
                            }
                        });
                } else {
                    console.log('authentication fail');
                    ws.close();
                }
            });
        });
    ws.on('close', () => {
        console.log('closed');
        if  ( profile )    {
            profile.closed = true;
        }
    })
    return  (ws);
}

const start = (env, endpoint, profile_name, localPort) => {
    if  ( !env.profiles[profile_name] )  {
        env.profiles[profile_name] = {
            closed: true
        };
    } else {
        env.profiles[profile_name].closed = true;
    }
    env.profiles[profile_name].localPort = localPort ? localPort : env.localPort;
    //console.log('start profile', env.profiles[profile_name]);
    env.profiles[profile_name].interval = setInterval(() => {
        //console.log(env.profiles[profile_name]);
        if  ( env.profiles[profile_name].closed )  {
            console.log('closed');
            try {
                //console.log('start', profile_name);
                tunnel(env, endpoint, profile_name);
            } catch (e) {
                console.log('error', e);
            }
        } else {
            //console.log('started');
        }
    }, 1000);
}

const stop = (env, profile_name) => {
    let ws = env.profiles[profile_name].ws;
    ws.close();
    clearInterval(env.profiles[profile_name].interval);
}

const check = (env, profile_name) => {
    let profile = env.profiles[profile_name];
    //console.log('check', profile);
    if  ( profile ) {
        if  ( profile.closed === undefined )    {
            return  false;
        } else {
            return  !profile.closed;
        }
    } else {
        return  false;
    }
}

module.exports = {
    start: start,
    stop: stop,
    check: check
}
