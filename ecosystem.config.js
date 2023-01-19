module.exports = {
	apps : [ {
		name: "imagify",
		script: "index.js",
		env: {
			"PORT": 4007
		}
	} ],
	deploy: {
		production: {
			user : 'deployer',
      host : '134.209.147.68',
			ref: "origin/main",
			repo: "git@github.com:dxmari/imagify.git",
			path: "/home/deployer/imagify",
			"post-deploy": "npm install && NODE_ENV=production pm2 reload ecosystem.config.js"
		}
	}
};