#
# Copyright (c) 2013, Joyent, Inc. All rights reserved.
#
# node-imgmanifest Makefile
#

#
# Files & Tools
#
JS_FILES	:= $(shell find lib test -name '*.js')
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_FILES_NODE   = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSSTYLE_FLAGS    = -o indent=4,doxygen,unparenthesized-return=0
NODEUNIT	:= ./node_modules/.bin/nodeunit
NPM 		:= npm

include ./tools/mk/Makefile.defs


#
# Repo-specific targets
#
.PHONY: all
all:
	$(NPM) install

$(NODEUNIT):
	$(NPM) install

.PHONY: test
test: | $(NODEUNIT)
	$(NODEUNIT) test/*.test.js

include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.targ
