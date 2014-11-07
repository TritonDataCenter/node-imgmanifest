#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2014, Joyent, Inc.
#

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

.PHONY: versioncheck
versioncheck:
	@echo version is: $(shell json -f package.json version)
	[[ `json -f package.json version` == `grep '^## ' CHANGES.md | head -1 | awk '{print $$2}'` ]]

include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.targ
