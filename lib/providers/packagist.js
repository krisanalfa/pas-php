var url = require('url'),
    semver = require('semver'),
    request = require('request');

var packagistProvider = {
    support: function(packageUrl) {
        'use strict';

        if (packageUrl.indexOf('packagist:') === 0 ||
            packageUrl.indexOf('https://packagist.org/p/') === 0) {
            return true;
        }
    },

    fetchIndices: function(queryUrl) {
        'use strict';

        var provider = this.require('provider');

        var parsed = this.parse(queryUrl),
            vendor = parsed.vendor,
            unit = parsed.unit;

        var packageName = parsed.name;
        var packageUrl = 'https://packagist.org/p/' + packageName + '.json';

        var indices = {
            releases: {},
            devs: {}
        };
        var reqOptions = {
            url: packageUrl,
            json: true
        };

        return new Promise(function(resolve, reject) {
            request(reqOptions, function(err, resp, body) {
                if (err) {
                    return reject(err);
                }

                var deps = body.packages[packageName];

                for(var i in deps) {
                    var version = i.indexOf('dev-') === 0 ? i.substr(4) : i;

                    if (deps[i].source.type === 'git') {

                        var dispatchProvider = provider.detect(deps[i].source.url).name;
                        var dispatchUrl;
                        if (dispatchProvider === 'github') {
                            dispatchUrl = deps[i].dist.url.replace('zipball', 'tarball');
                        } else {
                            throw new Error('Packagist: Unimplemented non-github yet. ' + dispatchProvider);
                        }

                        if (semver.valid(version)) {
                            indices.releases[version] = {
                                name: version,
                                type: 'release',
                                dispatch: dispatchProvider,
                                url: dispatchUrl,
                            };
                        } else {
                            indices.devs[version] = {
                                name: version,
                                type: 'dev',
                                dispatch: dispatchProvider,
                                url: dispatchUrl,
                            };
                        }

                    } else {
                        throw new Error('Packagist: Unimplemented dependency source from: ' + deps[i].source.type);
                    }
                }


                resolve(indices);
            }).on('error', reject);
        });
    },

    normalizeUrl: function(queryUrl) {
        'use strict';

        if (this.support(queryUrl)) {
            return queryUrl;
        }

        return 'packagist:' + queryUrl;
    },

    pull: function(from, toPath) {
        'use strict';

        if (from.dispatch) {
            var provider = this.require('provider');
            return provider(from.dispatch).pull(from, toPath);
        } else {
            throw new Error('Packagist does not implemented own pull yet, dispatch must exists');
        }
    }
};

module.exports = packagistProvider;