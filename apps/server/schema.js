export const addSchemas = async instance => {
	instance.addSchema({
		$id: 'uri',
		type: 'string',
		format: 'uri',
		example: 'https://example.com',
	});
};
