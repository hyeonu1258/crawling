const x = require('casper').selectXPath;
const fs = require('fs');
const casper = require('casper').create({
    verbose: false,
    logLevel: "debug",
    viewportSize: {
        width: 1024,
        height: 768
    }
});

REVIEW_CONTENT = 1, HEIGHT = 2, WEIGHT = 3, HEIGHTTITLE = 4, WEIGHTTITLE = 5, PROD_NAME = 6, REVIEW_IMAGE_URL = 7, PROD_PURCHASE_SITE_URL = 8, PROD_IMAGE_URL = 9, PROD_RATING = 10, USER_ID = 11;
TOP = 15522, OUTER = 15515, DRESS = 15510, SKIRT = 15541, PANTS = 15497, SHOES = 15553, BAG = 15565, ACC = 77;
var i = 0;
var k = 0;
var category = TOP;       // 카테고리 종류
var currentPage = 1;      // 출력할 페이지
var pageCount = 1;        // 출력할 페이지 수
var url = "http://widgets3.cre.ma/stylenanda.com/reviews?category_id=" + category + "&page=" + currentPage;
var clickPage;
var reviewLength;
var review_content = [],
    review_image_url = [],
    type = [],
    height = [],
    weight = [],
    prod_name = [],
    prod_image_url = [],
    prod_rating = [],
    prod_purchase_site_url = [],
    ratingCheck = [],
    user_id = [],
    heightTitle, weightTitle;

function Review(review_content, review_image_url, type, height, weight, prod_name, prod_image_url, prod_purchase_site_url, prod_rating, user_id) {
    this.review_content = review_content;
    this.review_image_url = review_image_url;
    this.type = type;
    this.height = height;
    this.weight = weight;
    this.prod_name = prod_name;
    this.prod_image_url = prod_image_url;
    this.prod_purchase_site_url = prod_purchase_site_url;
    this.prod_rating = prod_rating;
    this.category = category;
    this.shopping_site_name = '스타일난다';
    this.user_id = user_id;
}
// 첫 페이지 로딩
casper.start(url, function() {
    casper.echo("URL : " + casper.getCurrentUrl());
    clickPage = currentPage;
});

// 페이지마다 클릭과 데이터 반복적으로 긁기
casper.repeat(pageCount, function() {
    console.log('페이지 : ' + currentPage + '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    casper.wait(500, clickMoreTag);
    casper.wait(500, bringReview);
    if(clickPage > 5)
        clickPage = 6;
    else
        clickPage++;
    currentPage++;
    casper.click('a.paginate_button:nth-child(' + clickPage + ')');
  });

// 결과 출력하기
casper.then(function() {
    reviewLength = 0;
    for (i in review_content) {
        if (!review_content[i]) reviewLength++;
        // printData();
    }
    console.log('누락된 리뷰 개수 : ', reviewLength);
});

// csv 파일로 저장
casper.then(function() {
    if(length == 0) {
        var reviewList = [];
        for(i in review_content) {
          var review = new Review(review_content[i], review_image_url[i], type, height[i], weight[i], prod_name[i], prod_image_url[i], prod_purchase_site_url[i], prod_rating[i], user_id[i]);
          reviewList[i] = review;
        }
        if(review) {
            jsonStr = JSON.stringify(reviewList);
            stream = fs.open('csv/review_list.json', {
                mode: 'aw',
                charset: 'UTF-8'        // json 파일로 저장 시
                // charset: 'EUC-KR'    // csv 또는 txt 파일로 저장 시
            });
            stream.writeLine(jsonStr);
            stream.flush();
            stream.close();
        }
    }
})

casper.run();

function clickMoreTag() {
    clickCount = 1;
    casper.repeat(20, function() {
        // casper.click(x('//*[@id="review_414043"]/div[1]/div[2]/a/div[2]/div'));         // XPath를 이용한 경로 설정
        casper.click('ul.reviews li:nth-child(' + clickCount + ') div.actions-container'); // Selector를 이용한 경로 설정
        clickCount++;
    });
}

// 데이터 긁기
function bringReview() {
    // 캡쳐 코드
    // fileLocate = './clicked_1.jpg';
    // this.captureSelector(fileLocate, 'html');
    // messages = casper.evaluate(getMessages);
    j = 1;
    casper.repeat(20, function() {
        // element.textContent - 도큐먼트의 엘리먼트 객체가 가지는 텍스트 뽑아내기
        // querySelector에 'ul.reviews li:nth-child(' + index + ')'가 안 먹힌다...
        review_image_url[i] = this.getElementsAttribute(selectorPath(REVIEW_IMAGE_URL, j), 'src');
        prod_image_url[i] = this.getElementAttribute(selectorPath(PROD_IMAGE_URL, j), 'src');
        prod_purchase_site_url[i] = this.getElementAttribute(selectorPath(PROD_PURCHASE_SITE_URL, j), 'data-product-url');
        ratingCheck[i] = this.getElementsAttribute(selectorPath(PROD_RATING, j), 'class');
        review_content[i] = this.fetchText(selectorPath(REVIEW_CONTENT, j));
        prod_name[i]  = this.fetchText(selectorPath(PROD_NAME, j));
        user_id[i] = this.fetchText(selectorPath(USER_ID, j));
        heightTitle = this.fetchText(selectorPath(HEIGHTTITLE, j));
        weightTitle = this.fetchText(selectorPath(WEIGHTTITLE, j));
        review_content[i] = review_content[i].replace(/(^\s*)|(\s*$)/g, '');
        prod_name[i] = prod_name[i].replace(/(^\s*)|(\s*$)/g, '');

        if (heightTitle == 'HEIGHT') {
            height[i] = this.fetchText(selectorPath(HEIGHT, j));
            height[i] = Number(height[i].split(' ')[0]);
        } else {
            height[i] = 0;
        }
        if (weightTitle == 'WEIGHT') {
            weight[i] = this.fetchText(selectorPath(WEIGHT, j));
            weight[i] = weight[i].split(' ')[0];
        } else {
            weight[i] = "";
        }

        prod_rating[i] = 0;
        for(k in ratingCheck[i]) {
            if(ratingCheck[i][k] == 'star ')
                prod_rating[i]++;
        }
        i++; j++;
    });
}

// 엘리먼트 경로
function selectorPath(variety, index) {
    switch (variety) {
        case REVIEW_CONTENT:
            path = 'ul.reviews li:nth-child(' + index + ') div.message.review-contents-style';
            break;
        case HEIGHT:
            path = 'ul.reviews li:nth-child(' + index + ') div.review-options div:nth-child(1) div.review-option-content';
            break;
        case WEIGHT:
            path = 'ul.reviews li:nth-child(' + index + ') div.review-options div:nth-child(2) div.review-option-content';
            break;
        case HEIGHTTITLE:
            path = 'ul.reviews li:nth-child(' + index + ') div.review-options div:nth-child(1) div.review-option-title';
            break;
        case WEIGHTTITLE:
            path = 'ul.reviews li:nth-child(' + index + ') div.review-options div:nth-child(2) div.review-option-title';
            break;
        case PROD_NAME:
            path = 'ul.reviews li:nth-child(' + index + ') a.link-product';
            break;
        case REVIEW_IMAGE_URL:
            path = 'ul.reviews li:nth-child(' + index + ') div.r-contents ul.images li img';
            break;
        case PROD_PURCHASE_SITE_URL:
            path = 'ul.reviews li:nth-child(' + index + ')';
            break;
        case PROD_IMAGE_URL:
            path = 'ul.reviews li:nth-child(' + index + ') img.loaded';
            break;
        case PROD_RATING:
            path = 'ul.reviews li:nth-child(' + index + ') div.star-rating-container span';
            break;
        case USER_ID:
            path = 'ul.reviews li:nth-child(' + index + ') span.name';
            break;
        default:
            path = '';
            break;
    }
    return path;
}

// 저장한 데이터 로그 찍기
function printData() {
    casper.echo("review[" + i + "]")
    casper.echo("review_content : " + review_content[i]);
    casper.echo("height : " + height[i]);
    casper.echo("weight : " + weight[i]);
    casper.echo("prod_name : " + prod_name[i]);
    casper.echo("prod_purchase_site_url : " + prod_purchase_site_url[i]);
    casper.echo("review_image_url : " + review_image_url[i]);
    casper.echo("prod_image_url : " + prod_image_url[i]);
    casper.echo("prod_rating : " + prod_rating[i]);
    casper.echo('user_id : ' + user_id[i]);
    casper.echo('---------------------------------------------------------------------------------------');
}

// this.evaluate('함수명')을 통하여 사용 - 함수에는 매개변수가 없어야하며, evaluate를 통해 함수가 실행된 결과 값이 출력된다.
function getAttributeList() {
    elements = document.querySelectorAll('ul.reviews li');
    return Array.prototype.map.call(elements, function(e) {
        return e.getAttribute('data-product-url');
    });
}
