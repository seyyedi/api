import gulp from 'gulp';
import polyfill from 'babel-polyfill';
import util from 'gulp-util';
import del from 'del';
import childProcess from 'child_process';
import readline from 'readline';

import log from './log';
import Server from './server';

gulp.task('server',
    done => {
        var server = new Server();

        server.start();

        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('', async answer => {
            rl.close();
            await server.close();
			done();
        });
    }
);

gulp.task('default', gulp.series(
    'server'
));

log.on('entry', entry => {
    switch (entry.level) {
        case 'info':
            util.log(entry.msg);
            break;
        default:
            break;
    }
});
