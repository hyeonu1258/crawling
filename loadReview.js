const fs = require('fs');
const mysql = require('mysql');
const async = require('async');

const data = fs.readFileSync('csv/review_list_top.json');
const reviewList = JSON.parse(data);

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    port: '3306',
    multiplestatements: true,
    database: 'ibubogosu'
});

var prod_id, review_id;

conn.connect(function(err) {
    if (err) {
        console.log('db connection err', err);
        throw err;
    }
    async.series([
            function(callback) {
                conn.beginTransaction(function(err) {
                    if (err) {
                        console.log('transaction err', err);
                        callback(err);
                    } else {
                        console.log('transaction success');
                        callback(null, 'transaction success');
                    }
                });
            },
            function(callback) {
                var i = 0;
                async.everySeries(reviewList, function(review, done) {
                    async.waterfall([
                        function(will) {
                            conn.query('select user_id from user where user_id=?', [review.user_id],
                                function(err, rows) {
                                    if (err) {
                                        console.log('waterfall uesr ' + i + ' query err');
                                        will(err);
                                    } else {
                                        if (rows.length > 0) {
                                            console.log('waterfall user ' + i + ' exist', rows);
                                            will('exist');
                                        } else {
                                            console.log('waterfall user ' + i + ' dont exist', rows);
                                            will(null, review.user_id);
                                        }
                                    }
                                });
                        },
                        function(arg, will) {

                            conn.query('insert into user(user_id, type, height, weight) values(?, ?, ?, ?)', [arg, 1, review.height, review.weight],
                                function(err, rows) {
                                    if (err) {
                                        console.log('waterfall regist user ' + i + ' query err ', err);
                                        will(err);
                                    } else {
                                        console.log('waterfall regist user ' + i + ' success', rows);
                                        will(null, rows);
                                    }
                                });
                        }
                    ], function(err, result) {
                        i++;
                        if (err) {
                            console.log('waterfall user err : ', err);
                            if (err == 'exist') done(null, true);
                            else done(err);
                        } else {
                            console.log('every user success', result);
                            done(null, !err);
                        }
                    });
                }, function(err, result) {
                    if (err) {
                        console.log('every regist user err : ', err);
                        callback(err);
                    } else {
                        console.log('every regist user success : ', result);
                        callback(null, result);
                    }
                });
            },
            function(callback) {
                var i = 0;
                async.everySeries(reviewList, function(review, done) {
                    async.series([
                        function(will) {
                            conn.query('select * from product where prod_name=?', [review.prod_name],
                                function(err, rows) {
                                    if (err) {
                                        console.log('series product ' + i + ' query err', err);
                                        will(err);
                                    } else {
                                        console.log(rows);
                                        if (rows.length > 0) {
                                            console.log('series product ' + i + ' exist');
                                            will('exist');
                                        } else {
                                            console.log('series product ' + i + ' dont exist');
                                            will(null, rows);
                                        }
                                    }
                                });
                        },
                        function(will) {
                            conn.query('insert into product(prod_name, prod_image_url, prod_purchase_site_url, category, shopping_site_name) values(?, ?, ?, ?, ?)', [review.prod_name, review.prod_image_url, review.prod_purchase_site_url, review.category, review.shopping_site_name],
                                function(err, rows) {
                                    if (err) {
                                        console.log('series regist product ' + i + ' query err', err);
                                        will(err);
                                    } else {
                                        console.log('series regist product ' + i + ' success');
                                        console.log(review.prod_name);
                                        will(null, rows);
                                        i++;
                                    }
                                });
                        }
                    ], function(err, result) {
                        if (err) {
                            console.log('series regist product err : ', err);
                            if (err == 'exist') done(null, 1);
                            else done(err);
                        } else {
                            console.log('series regist product success ', result);
                            done(null, !err);
                        }
                    });
                }, function(err, result) {
                    if (err) {
                        console.log('every regist product err : ', err);
                        callback(err);
                    } else {
                        console.log('every regist product result : ', result);
                        callback(null, 'insert product success');
                    }
                });
            },
            function(callback) {
                var i = 0;
                async.everySeries(reviewList, function(review, done) {
                    async.waterfall([
                            function(will) {
                                conn.query('select prod_id from product where prod_name=?', [review.prod_name],
                                    function(err, rows) {
                                        if (err) {
                                            console.log('waterfall product ' + i + 'query error', err);
                                            will(err);
                                        } else {
                                            console.log(JSON.stringify(rows[0]));
                                            if (rows.length < 1) {
                                                console.log('waterfall product ' + i + ' dont exist');
                                                will('waterfall product ' + i + ' dont exist');
                                            } else {
                                                console.log('waterfall product ' + i + ' exist', rows);
                                                will(null, JSON.parse(JSON.stringify(rows[0])));
                                            }
                                        }
                                    });
                            }
                        ],
                        function(err, result) {
                            i++;
                            if (review.review_image_url.length > 0) exist = 1;
                            else exist = 0;
                            conn.query('insert into review(review_content, type, height, weight, prod_rating, image_exist_chk, prod_id, user_id) values(?, ?, ?, ?, ?, ?, ?, ?)', [review.review_content, 1, review.height, review.weight, review.prod_rating, exist, result.prod_id, review.user_id],
                                function(err, rows) {
                                    console.log(rows);
                                    if (err) {
                                        console.log('waterfall regist review ' + i + ' query err', err);
                                        done(err);
                                    } else {
                                        console.log('waterfall regist review ' + i + ' success');
                                        done(null, !err);
                                    }
                                });
                        });
                }, function(err, result) {
                    if (err) {
                        console.log('every regist review err ', err);
                        callback(err);
                    } else {
                        console.log('every regist review success ', result);
                        callback(null, result);
                    }
                });
            },
            function(callback) {
                var i = 0;
                async.everySeries(reviewList, function(review, done) {
                    async.waterfall([
                        function(will) {
                            console.log(review.prod_name);
                            console.log(review.review_image_url);
                            if (review.review_image_url.length < 1) {
                                console.log('waterfall review ' + i + ' no image url');
                                will('no url');
                            } else {
                                console.log('waterfall review ' + i + ' image url exist');
                                will(null, review.prod_name);
                            }
                        },
                        function(arg, will) {
                            console.log(arg);
                            conn.query('select prod_id from product where prod_name=?', [arg],
                                function(err, rows) {
                                    if (err) {
                                        console.log('waterfall product ' + i + ' query err', err);
                                        will(err);
                                    } else {
                                        console.log('waterfall product ' + i + ' exist', rows);
                                        will(null, JSON.parse(JSON.stringify(rows[0])));
                                    }
                                });
                        },
                        function(arg, will) {
                            conn.query('select review_id from review where prod_id=? and user_id=?', [arg.prod_id, review.user_id],
                                function(err, rows) {
                                    if (err) {
                                        console.log('waterfall review ' + i + ' query err', err);
                                        will(err);
                                    } else {
                                        console.log(rows);
                                        if (rows.length < 1) {
                                            console.log('waterfall review ' + i + ' dont exist');
                                            will('waterfall review ' + i + ' dont exist');
                                        } else {
                                            console.log('waterfall review ' + i + ' exist');
                                            will(null, JSON.parse(JSON.stringify(rows[0])));
                                        }
                                    }
                                });
                        },
                        function(arg, will) {
                            var j = 0;
                            async.every(review.review_image_url, function(url, did) {
                                conn.query('insert into review_image_url(review_image_url, review_id) values(?, ?)', [url, arg.review_id],
                                    function(err, rows) {
                                        if (err) {
                                            console.log('every regist review image ' + i + ' query err ', err);
                                            did(err);
                                        } else {
                                            console.log('every regist review image ' + i + ' success', rows);
                                            did(null, !err);
                                        }
                                    });
                            }, function(err, result) {
                                if (err) {
                                    console.log('every regist review image err ', err);
                                    will(err);
                                } else {
                                    console.log('every regist review image success');
                                    will(null, result);
                                }
                            });
                        }
                    ], function(err, result) {
                        i++;
                        if (err) {
                            console.log('waterfall result err : ', err);
                            if (err == 'no url') done(null, true);
                            else done(err);
                        } else {
                            console.log('waterfall result success : ', result);
                            done(null, !err);
                        }
                    });
                }, function(err, result) {
                    if (err) {
                        console.log('every result : ', err);
                        callback(err);
                    } else {
                        console.log(result);
                        callback(null, result);
                    }
                });
            }
        ],
        function(err, result) {
            if (err) {
                console.log('series err', err);
                conn.rollback();
                conn.release;
            } else {
                console.log('series success ', result);
                conn.commit();
                conn.release;
            }
        });
});
