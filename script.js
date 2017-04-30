var targetUrl = 'https://developers-jp.googleblog.com/';
//同一サイト内で取得する最大数
var LIMIT = 5;
var FIRST_ITEM_OFFSET = 1;

//以下のプロパティが使える
//webSite[key].title
//webSite[key].links
var webSites = {};

function addWebSite(url, title, links) {
  webSites[url] = { title: title, links: links };
  Logger.log('call');
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menus = [{ name: 'サイトマップを取得する', functionName: 'getTargetUrl' }];
  ss.addMenu('サイトマップ', menus);
}

function getTargetUrl() {

  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sh.getRange('B1');

  var url = range.getValue();

  //validate
  if (url.length == 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast('URLを入力してください', 'URLの未入力', 3);
  } else {

    cleanUp();

    targetUrl = url;

    var urls = [targetUrl];

    //fqdnが一致しているリンク一覧を取得する
    for (var i = 0; i < urls.length; i++) {
      //      Logger.log('get:' + urls[i]);
      parseXml(urls[i], function (url) {
        Logger.log('newUrl:' + url);

        if (urls.indexOf(url) == -1 && urls.length < LIMIT) {
          urls.push(url);
        }
      });
    }

    Logger.log('----Result----')
    Logger.log(webSites)

    for (var key in webSites) {
      var webSite = webSites[key];
      insertWebSite(key, webSite.title, webSite.links);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('LINKを取得しました', '完了', 3);

    /*
    fqdnの抽出 = array[uri]の生成
    targetURLのlink一覧がシートに出力される
    取得済サイトをStackしておく
    全リンクが取得できるまで繰り返す
    */
  }
}

/**
@params url リンク一覧を取得するURL
@params callback 取得したURL
*/
function parseXml(url, callback) {
  var xml = UrlFetchApp.fetch(url).getContentText();
  var result = getATagArray(xml);
  var fqdn = targetUrl.match(/(^https:|^http:)\/\/.*?\//)[0];

  Logger.log(targetUrl + "-----" + fqdn);

  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var links = result.map(function (url) {
    return getLink(url);
  }).filter(function (url, i, self) {
    //    Logger.log(fqdn);
    //fqdnが一致し配列に含まれていなければ追加する
    return url.indexOf(fqdn) == 0 && self.indexOf(url) === i;
  });

  //ページ内に含まれるリンクをシートへ挿入
  links.forEach(function (val, index, ar) {
    //    var lastRow = sh.getLastRow() + FIRST_ITEM_OFFSET;
    //    var cell = sh.getRange('A' + lastRow);
    //    cell.setValue(val);

    callback(val);
  });

  Logger.log('parseXml:' + url);
  addWebSite(url, getTitle(xml), links);

  return links;
}

function addSiteTitle(url, title) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sh.getLastRow() + FIRST_ITEM_OFFSET;
  sh.getRange('A' + lastRow).setValue(url);
  sh.getRange('B' + lastRow).setValue(title);
}

/**
Tagが
<a href=xxx>
のものを配列で返す
*/
function getATagArray(xml) {
  //改行コードを消去
  xml = xml.replace(/\n/g, '');
  var myRe = /<a href=.+?>/g;
  return xml.match(myRe);
}

/**
aTagからLinkを取得する
**/
function getLink(xml) {
  //改行コードを消去
  var _xml = xml.replace(/\n/g, '');
  var myRe = /<a href=(.+?)>/;

  return _xml.match(myRe)[1].replace(/\s+.*/, '').replace(/\'|"/g, '');
}


function getTitle(xml) {
  var myRe = /<title>(.*)<\/title>/;
  var result = xml.match(myRe);
  if (result.length >= 1) {
    return result[1];
  } else {
    return "";
  }
}

function writeCell(range) {

  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sh.getRange(range);
  range.setValue('test');
}

function cleanUp() {

  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  //  var range = sh.getRange(range);

  sh.getRange(2, 1, sh.getLastRow(), 2).setValue('');
}

function insertWebSite(url, title, links) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  addSiteTitle(url, title);
  links.forEach(function (val) {
    var lastRow = sh.getLastRow() + 1;
    var cell = sh.getRange('A' + lastRow);
    cell.setValue(val);
  });
}

//------Test-----

function testXml() {
  var xml = "<a href='/.'><h2> Japan </h2></a><a href='/.'><h2> Japan </h2></a>";
  var result = replace(xml);

  Browser.msgBox(result);

  if (result.length > 1) {
    //    Browser.msgBox(result[1]);
  } else {
    throw new Error("invalid array.");
  }
}

function testXmlLink() {
  var xml = "<a href='/.'>";
  var result = getLink(xml);
  if (result == "/.") {
    Logger.log('success');
  } else {
    throw new Error("invalid text.:" + result);
  }

  var xml2 = "<a href=\"http://hogehoge.com   hogehoge\">";
  var result2 = getLink(xml2);
  if (result2 == "http://hogehoge.com") {
    Logger.log('success');
  } else {
    throw new Error("invalid text.:" + result2);
  }
}

function testWriteCelli() {
  writeCell('A1');
}

function testGetTitle() {
  var xml = UrlFetchApp.fetch('http://uxmilk.jp/12852#toc0').getContentText();

  var title = getTitle(xml);
  Logger.log(title);
  if (title == '') {
    throw new Error("don't fetch title.");
  }
}

function testWebSite() {

  addWebSite('http://hoge.com', 'hogehoge', ['http://hoge.com/1', 'http://hoge.com/2']);
  for (var key in webSites) {
    Logger.log(key + ':' + webSites[key].title);
    Logger.log(key + ':' + webSites[key].links);
  }
}

function testInsertWebSite() {
  addWebSite('http://hoge.com', 'hogehoge', ['http://hoge.com/1', 'http://hoge.com/2']);
  for (var key in webSites) {
    var webSite = webSites[key];
    Logger.log(webSite);
    insertWebSite(key, webSite.title, webSite.links);
  }
}