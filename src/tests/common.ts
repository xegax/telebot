import cmn = require('../core/common');

function mustBe(left, right) {
    if (left != right)
        console.log('must be', right);
}

function doTest() {
    mustBe(cmn.getFormatedBytes(1024), '1024 bytes');
    mustBe(cmn.getFormatedBytes(1024 + 1), '1 Kb');
    mustBe(cmn.getFormatedBytes(1024 * 1024), '1024 Kb');
    mustBe(cmn.getFormatedBytes(1024 * 1024 + 1), '1 Mb');
    mustBe(cmn.getFormatedBytes(1024 * 1024 * 1024), '1024 Mb');
    mustBe(cmn.getFormatedBytes(1024 * 1024 * 1024 + 1), '1 Gb');
}

doTest();