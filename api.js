import amqp from 'amqplib';
import log from './log';

export default class Api {
	constructor(namespace) {
		this.namespace = namespace;
	}

	getQueueName(name) {
		return this.namespace + '.' + name;
	}

	async connect() {
		this.connection = await amqp.connect('amqp://admin:NinoSeyyedi2015!@localhost');
		this.channel = await this.connection.createChannel();

		await this.channel.assertExchange(
			this.getQueueName('nino')
		);
	}

	async shutdown() {
		this.running = false;

		if (this.connection)
		{
			try {
				await this.connection.close();
			} catch (e) {
				log.info(e);
			}
		}
	}

	async run() {
		if (this.running) return;
		var retryCount = 0;

		while (!this.running) {
			try {
				await this.connect();
				this.running = true;
			} catch (e) {
				log.info(e);

				retryCount++;
				log.info('Reconnecting to api #' + retryCount);
			}
		}
	}
}
