<div data-widget-area="header">
	{{{each widgets.header}}}
	{{widgets.header.html}}
	{{{end}}}
</div>

<div class="feed">
	<div class="topic-list-header btn-toolbar">
		<!-- IMPORT partials/category/filter-dropdown-left.tpl -->
		<!-- IMPORT partials/topic-terms.tpl -->
	</div>
	<div class="row">
		<div data-widget-area="left" class="col-lg-3 col-sm-12 {{{ if !widgets.left.length }}}hidden{{{ end }}}">
			{{{each widgets.left}}}
			{{widgets.left.html}}
			{{{end}}}
		</div>
		{{{ if (widgets.left.length && widgets.right.length) }}}
		<div class="col-lg-6 col-sm-12">
		{{{ end }}}
		{{{ if (!widgets.left.length && !widgets.right.length) }}}
		<div class="col-lg-12 col-sm-12">
		{{{ end }}}
		{{{ if ((widgets.left.length && !widgets.right.length) || (!widgets.left.length && widgets.right.length)) }}}
		<div class="col-lg-9 col-sm-12">
		{{{ end }}}
			{{{ if !posts.length  }}}
			<div class="alert alert-warning text-center">[[best-posts:no-posts-found]]</div>
			{{{ end }}}
			<!-- IMPORT partials/posts_list.tpl -->

			{{{ if config.usePagination }}}
			<!-- IMPORT partials/paginator.tpl -->
			{{{ end }}}
		</div>

		<div data-widget-area="right" class="col-lg-3 col-sm-12 {{{ if !widgets.right.length }}}hidden{{{ end }}}">
			{{{each widgets.right}}}
			{{widgets.right.html}}
			{{{end}}}
		</div>
	</div>
</div>

<div data-widget-area="footer">
	{{{each widgets.footer}}}
	{{widgets.footer.html}}
	{{{end}}}
</div>