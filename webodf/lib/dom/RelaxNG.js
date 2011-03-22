/*global runtime dom*/

/**
 * @constructor
 * @param {!string} url path to the Relax NG schema
 */
dom.RelaxNG = function RelaxNG(url) {
    var rngns = "http://relaxng.org/ns/structure/1.0",
        loaded = false,
        errormessage,
        queue = [],
        start,
        validate,
        nsmap = {};

    /**
     * @constructor
     * @param {!string} error
     * @param {!Node=} context
     */
    function RelaxNGParseError(error, context) {
        this.message = function () {
            if (context) {
                error += (context.nodeType === 1) ? " Element " : " Node ";
                error += context.nodeName + " with value '" + context.nodeValue + "'.";
            }
            return error;
        };
    }
    /**
     * handle validation requests that were added while schema was loading
     * @return {undefined}
     */
    function handleQueue() {
        if (!queue) {
            return;
        }
        var i;
        for (i = 0; i < queue.length; i += 1) {
            queue[i]();
        }
        queue = undefined;
    }
    /**
     * @param {!Document} dom
     * @return {?string}
     */
    function parseRelaxNGDOM(dom) {
        function splitToDuos(e) {
            if (e.e.length <= 2) {
                return e;
            }
            return splitToDuos({
                name: e.name,
                e: [
                    { name: e.name, e: e.e.slice(0, 2) },
                    e.e.slice(2)
                ]
            });
        }
   
        function parse(element) {
            // parse all elements from the Relax NG namespace into JavaScript objects
            var e = [], a = {}, c = element.firstChild, atts = element.attributes,
                att, i, text = "", name = element.localName, names = [], ce;
            for (i = 0; i < atts.length; i += 1) {
                att = atts.item(i);
                if (!att.namespaceURI) {
                    if (att.localName === "name" &&
                            (name === "element" || name === "attribute")) {
                        names.push(att.value);
                    } else {
                        a[att.localName] = att.value;
                    }
                } else if (att.namespaceURI === "http://www.w3.org/2000/xmlns/") {
                    nsmap[att.value] = att.localName;
                }
            }
            while (c) {
                if (c.nodeType === 1 && c.namespaceURI === rngns) {
                    ce = parse(c);
                    if (ce.name === "name") {
                        names.push(ce.text);
                    } else {
                        e.push(ce);
                    }
                } else if (c.nodeType === 3) {
                    text += c.nodeValue;
                }
                c = c.nextSibling;
            }
            // 4.2 strip leading and trailing whitespace
            if (name !== "value" && name !== "param") {
                text = /^\s*([\s\S]*\S)?\s*$/.exec(text)[1];
            }
            // 4.3 datatypeLibrary attribute
            // 4.4 type attribute of value element
            if (name === "value" && a.type === undefined) {
                a.type = "token";
            }
            // 4.5 href attribute
            // 4.6 externalRef element
            // 4.7 include element
            // 4.8 name attribute of element and attribute elements
            // already done earlier in this function
            // 4.9 ns attribute
            // 4.10 QNames
            // 4.11 div element
            // 4.12 Number of child elements
            if (e.length > 1 && (name === "define" || name === "oneOrMore" ||
                    name === "zeroOrMore" || name === "optional" || name === "list" ||
                    name === "mixed" || name === "element")) {
                e = splitToDuos({ name: "group", e: e}).e;
            }
            // if node has only one child, replace node with child
            if (e.length === 1 && (name === "choice" || name === "group" ||
                    name === "interleave")) {
                name = e[0].name;
                a = e[0].a;
                text = e[0].text;
                e = e[0].e;
            } else if (e.length > 2 && (name === "choice" || name === "group" ||
                    name === "interleave")) {
                e = splitToDuos({name: name, e: e}).e;
            }
            // 4.13 mixed element
            if (name === "mixed") {
                name = "interleave";
                e = [ e[0], { name: "text" } ];
            }
            // 4.14 optional element
            if (name === "optional") {
                name = "choice";
                e = [ e[0], { name: "empty" } ];
            }
            // 4.15 zeroOrMore element
            if (name === "zeroOrMore") {
                name = "choice";
                e = [ {name: "oneOrMore", e: [ e[0] ] }, { name: "empty" } ];
            }
            return { name: name, a: a, e: e, text: text, names: names };
        }
    
        function resolveDefines(def, defines) {
            var i = 0, e, defs, end;
            def.resolved = true;
            while (def.e && i < def.e.length) {
                e = def.e[i];
                if (e.name === "ref") {
                    defs = defines[e.a.name];
                    if (!def) {
                        throw e.a.name + " was not defined.";
                    }
                    end = def.e.slice(i + 1);
                    def.e = def.e.slice(0, i);
                    def.e = def.e.concat(defs.e);
                    def.e = def.e.concat(end);
                } else {
                    i += 1;
                    if (!e.resolved) {
                        resolveDefines(e, defines);
                    }
                }
            }
        }

        function main() {
            var grammar = parse(dom && dom.documentElement),
                i, e, defines = {};

            for (i = 0; i < grammar.e.length; i += 1) {
                e = grammar.e[i];
                if (e.name === "define") {
                    defines[e.a.name] = e;
                } else if (e.name === "start") {
                    start = e;
                }
            }
            if (!start) {
                return "No Relax NG start element was found.";
            }
            try {
                resolveDefines(start, defines);
                for (i in defines) {
                    if (defines.hasOwnProperty(i)) {
                        resolveDefines(defines[i], defines);
                    }
                }
            } catch (err) {
                return err;
            }
            return null;
        }
        return main();
    }
    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateAttribute(elementdef, walker) {
        // the attribute should be on the parent of the current node
        runtime.log("hi");
    }
    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
    function validateOptional(elementdef, walker) {
        // the group of definitions in this list is optional, we try to parse it
        // if there is an error, we stop
        var start = walker.currentNode,
            errors = validate(elementdef, walker);
        if (errors) {
            // if an error occurs: rewind
            walker.currentNode = start;
        }
        // optional elements cannot return errors
        return null;
    }
     */
    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateOneOrMore(elementdef, walker) {
        // The list of definitions in the elements list should be completely traversed
        // at least once
        // If a second or later round fails, the walker should go back to the start of
        // the last successful traversal
        var node, i = 0, err;
        do {
            node = walker.currentNode;
            err = validate(elementdef, walker);
            i += 1;
        } while (!err);
        if (i > 1) { // at least one round was without error
            // set position back to position of before last failed round
            walker.currentNode = node;
            return null;
        }
        return err;
    }
    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
    function validateZeroOrMore(elementdef, walker) {
        // If a round fails, the walker should go back to the start of
        // the last successful traversal
        var node, i = 0, err;
        do {
            node = walker.currentNode;
            err = validate(elementdef, walker);
            i += 1;
        } while (!err);
        if (i > 0) { // at least one round was without error
            // set position back to position of before last failed round
            walker.currentNode = node;
            return null;
        }
        return err;
    }
     */
    /**
     * @param {!Node} node
     * @return {!string}
     */
    function qName(node) {
        return nsmap[node.namespaceURI] + ":" + node.localName;
    }
    /**
     * @param {!Node} node
     * @return {!boolean}
     */
    function isWhitespace(node) {
        return node && node.nodeType === 3 && /^\s+$/.test(node.nodeValue);
    }
    /**
     * Validate an element.
     * Function forwards the walker until an element is met.
     * If element if of the right type, it is entered and the validation continues
     * inside the element. After validation, regardless of whether an error occurred,
     * the walker is at the same depth in the dom tree.
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateElement(elementdef, walker) {
        // forward until an element is seen, then check the name
        var /**@type{Node}*/ node = walker.currentNode,
            /**@type{number}*/ type = node ? node.nodeType : 0,
            error;
        // find the next element, skip text nodes with only whitespace
        while (type > 1) {
            if (type !== 3 || !/^\s+$/.test(walker.currentNode.nodeValue)) {// TEXT_NODE
                return [new RelaxNGParseError("Not allowed node of type " + type +
                        ".")];
            }
            node = walker.nextSibling();
            type = node ? node.nodeType : 0;
        }
        if (!node) {
            return [new RelaxNGParseError("Missing element " + elementdef.names)];
        }
        if (elementdef.names.indexOf(qName(node)) === -1) {
            return [new RelaxNGParseError("Found " + node.nodeName +
                    " instead of " + elementdef.names + ".", node)];
        }
        // the right element was found, now parse the contents
        if (walker.firstChild()) {
            // currentNode now points to the first child node of this element
            error = validate(elementdef, walker);
            // there should be no content left
            while (walker.nextSibling()) {
                if (!isWhitespace(walker.currentNode)) {
                    return [new RelaxNGParseError("Spurious content.",
                            walker.currentNode)];
                }
            }
            if (walker.parentNode() !== node) {
                return [new RelaxNGParseError("Implementation error.")];
            }
        }
        // move to the next node
        node = walker.nextSibling() || walker.parentNode();
        return error;
    }
    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateChoice(elementdef, walker) {
        // loop through child definitions and return if a match is found
        var i, e, l = elementdef.e.length, name, node = walker.currentNode;
        while (node && isWhitespace(node)) {
            node = walker.nextSibling();
        }
        if (!walker.currentNode) {
            return [new RelaxNGParseError("Missing element.")];
        }
        if (walker.currentNode.nodeType !== 1) {
            return [new RelaxNGParseError("Expected element.", walker.currentNode)];
        }
        name = walker.currentNode.nodeName;
        for (i = 0; i < l; i += 1) {
            e = elementdef.e[i];
            if (e.name !== "element") {
                throw "Choice must only have 'element' children, not " + e.name + ".";
            }
            if (e.names.indexOf(qName(walker.currentNode)) === -1) {
                return validateElement(e, walker);
            }
        }
        return [new RelaxNGParseError("Element " + name + " is not allowed here.")];
    }
    /**
     * @param elementdef
     * @param walker
     * @return {Array.<RelaxNGParseError>}
     */
    function validateInterleave(elementdef, walker) {
        // we assume that each part of the interleave is optional
        runtime.log("interleave");
        var cont = false, i, err, start, node;
        do {
            start = walker.currentNode;
            for (i = 0; i < elementdef.e.length; i += 1) {
                node = walker.currentNode;
                err = validate(elementdef.e[i], walker);
                if (err) {
                    walker.currentNode = node;
                }
            }
        } while (start !== walker.currentNode);
    }
    /**
     * Validate the next part
     * @param {!Object} elementdef
     * @param {!TreeWalker} walker
     * @return {Array.<RelaxNGParseError>}
     */
    validate = function validate(elementdef, walker) {
        var i, e, err = null;
        for (i = 0; !err && i < elementdef.e.length; i += 1) {
            // skip until an element is encountered, then enter it
            e = elementdef.e[i];
            if (e.name === "element") {
                err = validateElement(e, walker);
            } else if (e.name === "choice") {
                err = validateChoice(e, walker);
            } else if (e.name === "attribute") {
                err = validateAttribute(e, walker);
            } else if (e.name === "oneOrMore") {
                err = validateOneOrMore(e, walker);
            } else if (e.name === "interleave") {
                err = validateInterleave(e, walker);
            } else {
                runtime.log("unknown type: " + e.name);
            }
        }
        return err;
    };
    /**
     * Validate the elements pointed to by the TreeWalker
     * @param {!TreeWalker} walker
     * @param {!function(Array.<RelaxNGParseError>):undefined} callback
     * @return {undefined}
     */
    function validateXML(walker, callback) {
        if (!loaded) {
            queue.push(function () {
                validateXML(walker, callback);
            });
            return;
        }
        if (errormessage) {
            callback(errormessage);
            return;
        }
        walker.currentNode = walker.root;
        var errors = validate(start, walker);
        callback(errors);
    }
    this.validate = validateXML;

    runtime.loadXML(url, function (err, dom) {
        loaded = true;
        if (err) {
            errormessage = err;
        } else {
            errormessage = parseRelaxNGDOM(dom);
        }
        handleQueue();
    });
};