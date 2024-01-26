<?php

class VisualDataJsonDataContentHandler extends \JsonContentHandler {
	/**
	 * @inheritDoc
	 */
	public function __construct( $modelId = CONTENT_MODEL_VISUALDATA_JSONDATA ) {
		parent::__construct( $modelId, [ CONTENT_FORMAT_JSON ] );
	}

	/**
	 * @return string
	 */
	protected function getContentClass() {
		return VisualDataJsonDataContent::class;
	}

}
