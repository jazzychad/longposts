var mongoose = require("mongoose");
var plugins = require("./plugins");

var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var BlogPostSchema = new Schema({

                            shortid: {
                              type: String,
                              index: true,
                              unique: true
                            },
                            ownerIdStr: {
                              type: String
                            },
                            ownerUsername: {
                              type: String
                            },
                            views: {
                              type: Number,
                              default: 0
                            },
                            postIdStr: {
                              type: String
                            },
                            draftText: {
                              type: String
                            },
                            title: {
                              type: String
                            },
                            tstamp: {
                              type: Date,
                              default: function() {return new Date();}
                            },
                            blurbText: {
                              type: String
                            },
                            num_stars: {
                              type: Number,
                              default: 0
                            },
                            num_replies: {
                              type: Number,
                              default: 0
                            },
                            num_reposts: {
                              type: Number,
                              default: 0
                            }
                          });

BlogPostSchema.plugin(plugins.create_shortid);

var BlogPost = mongoose.model('BlogPost', BlogPostSchema);

module.exports.BlogPost = BlogPost;


