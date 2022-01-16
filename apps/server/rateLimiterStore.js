export function RateLimiterStore(options) {
	this.options = options;
	this.route = '';
}


RateLimiterStore.prototype.routeKey = function routeKey(route) {
	if (route) this.route = route;
	return route;
};


RateLimiterStore.prototype.child = function child(routeOptions = {}) {
	const options = Object.assign(this.options, routeOptions);
	const store = new RateLimiterStore(options);
	store.routeKey(routeOptions.routeInfo.method + routeOptions.routeInfo.url);
	return store;
};


export function getIncrFunction(fastify){

	RateLimiterStore.prototype.incr=async function(key ,cb) {
		const now = new Date().getTime();
		let ttl = now + this.options.timeWindow;
		
		const cond = { Route: this.route, Source: key };
	
		const RateLimit = await fastify.db.getRateLimit(key,this.route)
		console.log(RateLimit.TTL , now ,parseInt(RateLimit.TTL,10)>now,"Incrementing",RateLimit.Count+1)
		if (RateLimit && parseInt(RateLimit.TTL, 10) > now) {
			try {
			
				await fastify.db.updateCount(this.route , key , RateLimit.Count+1,RateLimit.TTL)
				cb(null, {
					current: RateLimit.Count + 1,
					ttl: RateLimit.TTL,
				});
			} catch (err) {
				console.log(err)
				cb(err, {
					current: 0,
				});
			}
		} else {
			try {
				await fastify.db.updateCount(
					this.route,
					key,
					1,
					ttl,
				);
				cb(null, {
					current: 1,
					ttl,
				});
			} catch (err) {
				console.log(err)
				cb(err, {
					current: 0,
				});
			}
		}
	}
}
