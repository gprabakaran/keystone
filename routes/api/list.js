var _ = require('underscore'),
	async = require('async'),
	keystone = require('../../');

exports = module.exports = function(req, res) {
	
	var sendResponse = function(status) {
		res.json(status);
	};
	
	var sendError = function(key, err, msg) {
		msg = msg || 'API Error';
		key = key || 'unknown error';
		msg += ' (' + key + ')';
		console.log(msg + (err ? ':' : ''));
		if (err) {
			console.log(err);
		}
		res.status(500);
		sendResponse({ error: key || 'error', detail: err });
	};
	
	switch (req.params.action) {
		
		case 'order':
			
			var order = req.query.order || req.body.order,
				queue = [];
			
			if ('string' == typeof order) {
				order = order.split(',');
			}
			
			_.each(order, function(id, i) {
				queue.push(function(done) {
					req.list.model.update({ _id: id }, { $set: { sortOrder: i }}, done);
				});
			});
			
			async.parallel(queue, function(err) {
				
				if (err) return sendError('database error', err);
				
				return sendResponse({
					success: true
				});
				
			});
			
		break;
		
		case 'get':
			
			req.list.model.findById(req.query.id).exec(function(err, item) {
				
				if (err) return sendError('database error', err);
				
				if (!item) return sendError('not found');
				
				switch (req.query.dataset) {
					case 'simple':
						return sendResponse({
							name: req.list.getDocumentName(item),
							id: item.id
						});
					break;
					default:
						return sendResponse(item);
				}
			});
			
		break;
		
		case 'autocomplete':
			
			var limit = req.query.limit || 10,
				page = req.query.page || 1,
				skip = limit * (page - 1);
			
			var query = req.list.model.find(req.list.getSearchFilters(req.query.q));
			
			var doQuery = function() {
				query.limit(limit)
					.skip(skip)
					.sort(req.list.defaultSort)
					.exec(function(err, items) {
						
						if (err) return sendError('database error', err);
						
						query.count(function(err, total) {
							
							if (err) return sendError('database error', err);
							
							sendResponse({
								total: total,
								items: items.map(function(i) {
									return {
										name: req.list.getDocumentName(i),
										id: i.id
									};
								})
							});
							
						});
						
					});
			}
			
			if (req.query.context == 'relationship') {
				
				var srcList = keystone.list(req.query.list);
				
				if (!srcList) return sendError('invalid list provided');
				
				var field = srcList.fields[req.query.field];
				
				if (!field || field.type != 'relationship') return sendError('invalid field provided');
				
				if (!field.hasFilters) {
					return doQuery();
				}
				
				srcList.model.findById(req.query.item, function(err, item) {
					
					if (err) return sendError('database error', err);
					
					field.addFilters(query, item);
					return doQuery();
					
				});
				
			} else {
				return doQuery();
			}
			
			
		break;
	}
	
};