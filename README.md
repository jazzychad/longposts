# adnblog (LongPosts)

adnblog is an App.net application which allows users to create
long-form posts by inserting the text body inside of an app.net post
annotation. Formatting of the post is supported with Markdown syntax.

andblog is a node.js app which can run on heroku. It uses express, mongo, and connect-auth... among other things.

It is publically available at [LongPosts.com](http://longposts.com).

## net.jazzychad.adnblog.post

adnblog and LongPosts are a reference implementation of the adnblog
annotation format:

      {
        type: "net.jazzychad.adnblog.post",
        value: {
          title: "Title of Post",
          body: "markdown formatted body",
          tstamp: <unix epoch timestamp in milliseconds (js style)>
        }
      }


## Development

To setup run the following commands:

npm install -d
heroku apps:create --stack cedar <app_name_here>
heroku addons:add mongolab:starter # free 240mg mongo tier

use foreman for local heroku testing

Copy `config.js.sample` to `config.js` and replace appropriate
values. **DO NOT PUT SENSITIVE KEYS OR INFORMATION IN THE SOURCE CODE
EVER. PUT THEM IN CONFIG.JS AND REFERENCE THEM FROM THE CODE. ALSO
NEVER COMMIT CONFIG.JS**

## Contributing

If you would like to contribute to this project, great! Please fork
this repo and get it up and running locally. Create a feature branch,
and then send a pull-request once you have finished it.

## Contact

Questions about how things work? Feel free to ping me on adn
@[jazzychad](https://alpha.app.net/jazzychad). Enterprising folks can
also find my email address through my website.

## Disclaimers

The code presented here was created over the ADN hackathon weekend in
October in about 6 hours total of work. Subsequent work was done over
the next few weeks, maybe another 8 hours worth of work. The code
quality is not superb, nor is the structure of the code ideal. Any
code quality/formatting/restructuring work is welcome. Please, for the
love of Pete, use spaces and not tabs.

## LICENSE

MIT License. See LICENSE for info.
