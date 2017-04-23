var targetUrl = 'https://developers-jp.googleblog.com/';

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
        targetUrl = url;

        //サイトマップ取得
        parseXml();
    }
}

function parseXml() {
    var xml = UrlFetchApp.fetch(targetUrl).getContentText();
    var result = getATagArray(xml);
    var fqdn = targetUrl.match(/(^https:|^http:)\/\/.*?\//)[0];

    Logger.log(targetUrl + "-----" + fqdn);

    var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var links = result.map(function (url) {
        return getLink(url);
    }).filter(function (url, i, self) {
        Logger.log(fqdn);
        //fqdnが一致し配列に含まれていなければ追加する
        return url.indexOf(fqdn) == 0 && self.indexOf(url) === i;
    });

    links.forEach(function (val, index, ar) {
        var cell = sh.getRange('A' + (index + 2));
        cell.setValue(val);
    });

    SpreadsheetApp.getActiveSpreadsheet().toast('LINKを取得しました', '完了', 3);
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

    Logger.log(_xml.match(myRe))

    return _xml.match(myRe)[1].replace(/\s+.*/, '').replace(/\'|"/g, '');
}

function writeCell(range) {

    var sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var range = sh.getRange(range);
    range.setValue('test');
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
