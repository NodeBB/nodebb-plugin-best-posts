
'use strict';

const _ = require('lodash');

const nconf = require.main.require('nconf');

const db = require.main.require('./src/database');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');
const posts = require.main.require('./src/posts');
const privileges = require.main.require('./src/privileges');
const pagination = require.main.require('./src/pagination');
const meta = require.main.require('./src/meta');

const plugin = module.exports;

const relative_path = nconf.get('relative_path');

plugin.init = async function (params) {
	routeHelpers.setupPageRoute(params.router, '/best-posts', renderBestPosts);
};

async function renderBestPosts(req, res, next) {
	let term = controllerHelpers.terms[req.query.term];
	if (!term && req.query.term) {
		return next();
	}
	term = term || 'alltime';

	const cids = getCidsArray(req.query.cid);
	const [categoryData, allPids] = await Promise.all([
		controllerHelpers.getSelectedCategory(cids),
		getPids(cids, term),
	]);

	delete req.query._;

	const pids = await privileges.posts.filter('topics:read', allPids, req.uid);

	const pageCount = Math.max(1, Math.ceil(pids.length / meta.config.postsPerPage));
	const page = Math.min(parseInt(req.query.page, 10) || 1, pageCount);

	const start = Math.max(0, (page - 1) * meta.config.postsPerPage);
	const stop = start + meta.config.postsPerPage - 1;
	const pagePids = pids.slice(start, stop + 1);
	const postData = await posts.getPostSummaryByPids(pagePids, req.uid, { stripTags: false });

	const url = 'best-posts';
	const isDisplayedAsHome = !(req.originalUrl.startsWith(`${relative_path}/api/${url}`) || req.originalUrl.startsWith(`${relative_path}/${url}`));
	const baseUrl = isDisplayedAsHome ? '' : url;
	const terms = controllerHelpers.buildTerms(baseUrl, term, req.query);

	res.render('best-posts', {
		posts: postData,
		allCategoriesUrl: `best-posts${controllerHelpers.buildQueryString(req.query, 'cid', '')}`,
		selectedCategory: categoryData.selectedCategory,
		selectedCids: categoryData.selectedCids,
		terms,
		selectedTerm: terms.find(term => term && term.selected),
		pagination: pagination.create(page, pageCount, req.query),
	});
}

async function getPids(cids, term) {
	if (term !== 'alltime') {
		const terms = {
			day: 86400000,
			week: 604800000,
			month: 2592000000,
		};
		let since = terms.day;
		if (terms[term]) {
			since = terms[term];
		}
		let pids = [];
		if (cids) {
			pids = _.flatten(await Promise.all(
				cids.map(cid => db.getSortedSetRevRangeByScore(`cid:${cid}:pids`, 0, -1, '+inf', Date.now() - since))
			));
		} else {
			pids = await db.getSortedSetRevRangeByScore('posts:pid', 0, -1, '+inf', Date.now() - since);
		}
		// sort by rep
		const scores = await db.sortedSetScores('posts:votes', pids);
		const postData = pids.map((pid, index) => ({ value: pid, score: scores[index] }));
		return postData.sort((p1, p2) => p2.score - p1.score).slice(0, 200).map(p => p.value);
	}

	if (cids) {
		const pids = _.flatten(await Promise.all(
			cids.map(async cid => db.getSortedSetRevIntersect({
				sets: ['posts:votes', `cid:${cid}:pids`],
				weights: [1, 0],
				start: 0,
				stop: 199,
				withScores: true,
			}))
		));
		return pids.sort((p1, p2) => p2.score - p1.score).slice(0, 200).map(p => p.value);
	}

	// all time top 200 posts no cid filtering
	return await db.getSortedSetRevRange('posts:votes', 0, 199);
}

function getCidsArray(cid) {
	if (cid && !Array.isArray(cid)) {
		cid = [cid];
	}
	return cid && cid.map(cid => parseInt(cid, 10));
}

plugin.defineWidgetAreas = async function (areas) {
	areas = areas.concat([
		{
			name: 'Best Posts Page (Header)',
			template: 'best-posts.tpl',
			location: 'header',
		},
		{
			name: 'Best Posts Page (Left)',
			template: 'best-posts.tpl',
			location: 'left',
		},
		{
			name: 'Best Posts Page (Right)',
			template: 'best-posts.tpl',
			location: 'right',
		},
		{
			name: 'Best Posts Page (Footer)',
			template: 'best-posts.tpl',
			location: 'footer',
		},
	]);
	return areas;
};
