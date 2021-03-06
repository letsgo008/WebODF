/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */
/*global runtime, core, odf, NodeFilter*/
runtime.loadClass("odf.OdfUtils");
/**
 * @constructor
 * @param {core.UnitTestRunner} runner
 * @implements {core.UnitTest}
 */
odf.OdfUtilsTests = function OdfUtilsTests(runner) {
    "use strict";
    var t,
        r = runner,
        namespace = {
            "text":"urn:oasis:names:tc:opendocument:xmlns:text:1.0",
            "office":"urn:oasis:names:tc:opendocument:xmlns:office:1.0",
            "style":"urn:oasis:names:tc:opendocument:xmlns:style:1.0",
            "fo":"urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
            "draw":"urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
            "svg":"urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
            "dr3d":"urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0"
        };

    this.setUp = function () {
        t = {
            testArea : core.UnitTest.provideTestAreaDiv(),
            ns: namespace
        };
        t.odfUtils = new odf.OdfUtils();
    };
    this.tearDown = function () {
        t.range.detach();
        t = {};
        core.UnitTest.cleanupTestAreaDiv();
    };
    function createDocument(dom) {
        var fragment;

        fragment = core.UnitTest.createOdtDocument("<office:text>" + dom + "</office:text>", namespace);
        t.testArea.appendChild(fragment.documentElement);
        t.range = t.testArea.ownerDocument.createRange();
        return t.testArea.firstChild.firstChild.childNodes.length === 1
            ? t.testArea.firstChild.firstChild.firstChild
            : t.testArea.firstChild.firstChild;
    }
    function isCharacterElement_ReturnTrueForTab() {
        t.doc = createDocument("<text:p><text:tab/></text:p>");
        t.isCharacter = t.odfUtils.isCharacterElement(t.doc.firstChild);
        r.shouldBe(t, "t.isCharacter", "true");
    }
    function isCharacterElement_ReturnTrueForSpace() {
        t.doc = createDocument("<text:p><text:s/></text:p>");
        t.isCharacter = t.odfUtils.isCharacterElement(t.doc.firstChild);
        r.shouldBe(t, "t.isCharacter", "true");
    }
    function isCharacterElement_ReturnTrueForLineBreak() {
        t.doc = createDocument("<text:p><text:line-break/></text:p>");
        t.isCharacter = t.odfUtils.isCharacterElement(t.doc.firstChild);
        r.shouldBe(t, "t.isCharacter", "true");
    }
    function isCharacterElement_ReturnTrueForCharacterFrame() {
        t.doc = createDocument("<text:p><draw:frame text:anchor-type='as-char'/></text:p>");
        t.isCharacter = t.odfUtils.isCharacterElement(t.doc.firstChild);
        r.shouldBe(t, "t.isCharacter", "true");
    }
    function isCharacterElement_ReturnFalseForNonCharacterFrame() {
        t.doc = createDocument("<text:p><draw:frame text:anchor-type='char'/></text:p>");
        t.isCharacter = t.odfUtils.isCharacterElement(t.doc.firstChild);
        r.shouldBe(t, "t.isCharacter", "false");
    }
    function getTextElements_EncompassedWithinParagraph() {
        t.doc = createDocument("<text:p>AB<text:s> </text:s>CD</text:p>");
        t.range.setStart(t.doc.childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[2], 0);

        t.paragraphs = t.odfUtils.getParagraphElements(t.range);
        t.textElements = t.odfUtils.getTextElements(t.range, false, false);

        r.shouldBe(t, "t.paragraphs.length", "1");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc");

        r.shouldBe(t, "t.textElements.length", "2");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0]"); // "AB"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[1]"); // text:s
    }
    function getTextElements_EncompassedWithinSpan_And_Paragraph() {
        t.doc = createDocument("<text:p><text:span>A</text:span>B<text:s/>CD</text:p>");
        t.range.setStart(t.doc.childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[2], 0);

        t.paragraphs = t.odfUtils.getParagraphElements(t.range);
        t.textElements = t.odfUtils.getTextElements(t.range, false, false);

        r.shouldBe(t, "t.paragraphs.length", "1");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc");

        r.shouldBe(t, "t.textElements.length", "3");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[0]"); // "A"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[1]"); // "B"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2]"); // text:s
    }
    function getTextElements_IgnoresEditInfo() {
        t.doc = createDocument("<text:p>AB<editinfo>HI</editinfo><text:s/>CD</text:p>");
        t.range.setStart(t.doc.childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[2], 0);

        t.paragraphs = t.odfUtils.getParagraphElements(t.range);
        t.textElements = t.odfUtils.getTextElements(t.range, false, false);

        r.shouldBe(t, "t.paragraphs.length", "1");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc");

        r.shouldBe(t, "t.textElements.length", "2");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0]"); // "AB"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2]"); // text:s
    }
    function getTextElements_SpansMultipleParagraphs() {
        t.doc = createDocument("<text:p>AB<text:s/>CD</text:p><text:p>EF<text:s/>GH</text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[1].childNodes[1], 0);

        t.paragraphs = t.odfUtils.getParagraphElements(t.range);
        t.textElements = t.odfUtils.getTextElements(t.range, false, false);

        r.shouldBe(t, "t.paragraphs.length", "2");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc.childNodes[0]");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc.childNodes[1]");

        r.shouldBe(t, "t.textElements.length", "5");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[0]"); // "AB"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[1]"); // text:s
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[2]"); // "CD"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[1].childNodes[0]"); // "EF"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[1].childNodes[1]"); // text:s
    }
    function getTextElements_IncludesInsignificantWhitespace() {
        t.doc = createDocument("<text:p>AB<text:s> </text:s>CD</text:p>\n<text:p>EF<text:s/>GH</text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[2].childNodes[1], 0);

        t.paragraphs = t.odfUtils.getParagraphElements(t.range);
        t.textElements = t.odfUtils.getTextElements(t.range, false, true);

        r.shouldBe(t, "t.paragraphs.length", "2");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc.childNodes[0]");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc.childNodes[2]");

        r.shouldBe(t, "t.textElements.length", "6");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[0]"); // "AB"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[1]"); // text:s
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[2]"); // "CD"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[1]"); // "\n"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2].childNodes[0]"); // "EF"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2].childNodes[1]"); // text:s
    }
    function getTextElements_ExcludesInsignificantWhitespace() {
        t.doc = createDocument("<text:p>AB<text:s> </text:s>CD</text:p>\n<text:p>EF<text:s/>GH</text:p>");
        t.range.setStart(t.doc.childNodes[0].childNodes[0], 0);
        t.range.setEnd(t.doc.childNodes[2].childNodes[1], 0);

        t.paragraphs = t.odfUtils.getParagraphElements(t.range);
        t.textElements = t.odfUtils.getTextElements(t.range, false, false);

        r.shouldBe(t, "t.paragraphs.length", "2");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc.childNodes[0]");
        r.shouldBe(t, "t.paragraphs.shift()", "t.doc.childNodes[2]");

        r.shouldBe(t, "t.textElements.length", "5");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[0]"); // "AB"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[1]"); // text:s
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0].childNodes[2]"); // "CD"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2].childNodes[0]"); // "EF"
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2].childNodes[1]"); // text:s
    }
    function getTextElements_CharacterElements() {
        t.doc = createDocument("<text:p><text:s> </text:s><text:tab>	</text:tab><text:line-break>\n</text:line-break><draw:frame text:anchor-type='as-char'><draw:image/></draw:frame></text:p>");
        t.range.selectNode(t.doc);

        t.textElements = t.odfUtils.getTextElements(t.range, false, true);

        r.shouldBe(t, "t.textElements.length", "4");
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[0]"); // text:s
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[1]"); // text:tab
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[2]"); // text:line-break
        r.shouldBe(t, "t.textElements.shift()", "t.doc.childNodes[3]"); // draw:frame
    }
    function getImageElements_ReturnTwoImages() {
        t.doc = createDocument("<text:h><text:span><draw:frame><draw:image/></draw:frame></text:span></text:h><text:p><text:span><draw:a><draw:frame><draw:image/></draw:frame></draw:a></text:span></text:p>");
        t.range.setStartBefore(t.doc.firstChild);
        t.range.setEndAfter(t.doc.lastChild);
        t.imageElements = t.odfUtils.getImageElements(t.range);

        r.shouldBe(t, "t.imageElements.length", "2");
        r.shouldBe(t, "t.imageElements.shift()", "t.doc.childNodes[0].firstChild.firstChild.firstChild");
        r.shouldBe(t, "t.imageElements.shift()", "t.doc.childNodes[1].firstChild.firstChild.firstChild.firstChild");
    }
    function isDowngradableWhitespace_DowngradesFirstSpaceAfterChar() {
        t.doc = createDocument("<text:p>a<text:s> </text:s>b</text:p>");
        t.isDowngradable = t.odfUtils.isDowngradableSpaceElement(t.doc.childNodes[1]);

        r.shouldBe(t, "t.isDowngradable", "true");
    }
    function isDowngradableWhitespace_DowngradesFirstSpaceAfterTab() {
        t.doc = createDocument("<text:p><text:tab>  </text:tab><text:s> </text:s>b</text:p>");
        t.isDowngradable = t.odfUtils.isDowngradableSpaceElement(t.doc.childNodes[1]);

        r.shouldBe(t, "t.isDowngradable", "true");
    }
    function isDowngradableWhitespace_DoesNotDowngradeTrailingSpace() {
        t.doc = createDocument("<text:p>a<text:s> </text:s></text:p>");
        t.isDowngradable = t.odfUtils.isDowngradableSpaceElement(t.doc.childNodes[1]);

        r.shouldBe(t, "t.isDowngradable", "false");
    }
    function isDowngradableWhitespace_DoesNotDowngradeLeading() {
        t.doc = createDocument("<text:p><text:s> </text:s>a</text:p>");
        t.isDowngradable = t.odfUtils.isDowngradableSpaceElement(t.doc.childNodes[0]);

        r.shouldBe(t, "t.isDowngradable", "false");
    }
    function isDowngradableWhitespace_DoesNotDowngradeAfterSpace() {
        t.doc = createDocument("<text:p>a<text:s> </text:s><text:s> </text:s>b</text:p>");
        t.isDowngradable1 = t.odfUtils.isDowngradableSpaceElement(t.doc.childNodes[1]);
        t.isDowngradable2 = t.odfUtils.isDowngradableSpaceElement(t.doc.childNodes[2]);

        r.shouldBe(t, "t.isDowngradable1", "true");
        r.shouldBe(t, "t.isDowngradable2", "false");
    }
    this.tests = function () {
        return r.name([
            isCharacterElement_ReturnTrueForTab,
            isCharacterElement_ReturnTrueForSpace,
            isCharacterElement_ReturnTrueForLineBreak,
            isCharacterElement_ReturnTrueForCharacterFrame,
            isCharacterElement_ReturnFalseForNonCharacterFrame,

            getTextElements_EncompassedWithinParagraph,
            getTextElements_EncompassedWithinSpan_And_Paragraph,
            getTextElements_IgnoresEditInfo,
            getTextElements_SpansMultipleParagraphs,
            getTextElements_IncludesInsignificantWhitespace,
            getTextElements_ExcludesInsignificantWhitespace,
            getTextElements_CharacterElements,
            getImageElements_ReturnTwoImages,

            isDowngradableWhitespace_DowngradesFirstSpaceAfterChar,
            isDowngradableWhitespace_DowngradesFirstSpaceAfterTab,
            isDowngradableWhitespace_DoesNotDowngradeTrailingSpace,
            isDowngradableWhitespace_DoesNotDowngradeLeading,
            isDowngradableWhitespace_DoesNotDowngradeAfterSpace
        ]);
    };
    this.asyncTests = function () {
        return [];
    };
};
odf.OdfUtilsTests.prototype.description = function () {
    "use strict";
    return "Test the OdfUtilsTests class.";
};
(function () {
    "use strict";
    return odf.OdfUtilsTests;
}());
