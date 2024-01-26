<?php

class VisualDataHtmlContent extends \TextContent {
	/**
	 * @inheritDoc
	 */
	public function __construct( $text ) {
		parent::__construct( $text, CONTENT_MODEL_VISUALDATA_HTML );
	}
}
