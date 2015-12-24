import path from 'path';
import http from 'http';
import minimist from 'minimist';
import express from 'express';
import bodyParser from 'body-parser';
import enableDestroy from 'server-destroy';
import robot from 'robotjs';
import ncp from 'copy-paste';

import log from './log';
import Api from './api';

export default class Server {
	constructor(options) {
		this.args = minimist(process.argv.slice(2));
		this.options = options || {};

		this.options.namespace = this.options.namespace
			|| this.args.namespace
			|| 'seyyedi';

		this.options.port = this.options.port
			|| parseInt(this.args.port, 10)
			|| 3000;
	}

	async start(port, realtimePort) {
		this.express = express();

		this.express.use(
			bodyParser.json()
		);

		this.receiveSms();

		this.http = this.express.listen(this.options.port);
		enableDestroy(this.http);
		log.info('Http server is online @*:' + this.options.port);

		this.api = new Api(this.options.namespace);
		await this.api.run();
		log.info('Api is online');
	}

	receiveSms() {
		this.rxTan = new RegExp("^.+([0-9a-zA-Z]{6})$");

		this.express.post('/api/sms', (req, res) => {
			var sms = req.body;
			sms.from = sms.from.trim();
			sms.message = sms.message.trim();

			log.info(`SMS from ${sms.from}: ${sms.message}`);

			var patterns = {
				postbank: "^.+([0-9a-zA-Z]{6})$",
				volksbank: "^.+([0-9a-zA-Z]{6}).+Zeit.+$"
			};

			if (sms.from === 'Postbank')
			{
				this.scanForMobileTan(sms.message, patterns.postbank);
			}
			else if (sms.from === "076121820") // Volksbank
			{
				this.scanForMobileTan(sms.message, patterns.volksbank);
			}
			else if (sms.from === "+4917623597389")
			{
				this.scanForMobileTan(sms.message, patterns.volksbank)
					|| this.scanForMobileTan(sms.message, patterns.postbank);
			}

			res.end();
		});
	}

	scanForMobileTan(message, pattern) {
		var match = message.match(new RegExp(pattern));

		if (match !== null) {
			var tan = match[1];

			ncp.copy(tan);
			robot.typeString(tan);
			//robot.keyTap('enter');

			return true;
		}

		return false;
	};

	async close() {
		if (this.http) {
			await this.http.destroy();
			log.info('Http server is offline');
		}

		if (this.api) {
			await this.api.shutdown();
			log.info('Api is offline');
		}
	}
}
