export const addSchemas = async instance => {
	instance.addSchema({
		$id: 'uri',
		type: 'string',
		format: 'uri',
		example: 'https://example.com',
	});
	instance.addSchema({
		$id: 'shortUrl',
		type: 'string',
		format: 'url',
		example: 'http://localhost:3000/abcdef',
	});
};
