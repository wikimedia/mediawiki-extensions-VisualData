<?php

/**
 * This file is part of the MediaWiki extension VisualData.
 *
 * VisualData is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * VisualData is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @ingroup extensions
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright ©2024, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use MediaWiki\Extension\VisualData\Aliases\Html as HtmlClass;
use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\Extension\VisualData\ResultPrinter;
use Parser;

class CarouselResultPrinter extends ResultPrinter {

	/** @var array */
	private $obj;

	/** @var array */
	private $mapProperties;

	/** @var array */
	public static $parameters = [
		'width' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'height' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'class' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'file-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'file',
		],
		'caption-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'caption',
		],
		'title-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'title',
		],
		'link-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'link',
		],
		'slick-accessibility' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-adaptiveHeight' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		// $params['slick-appendArrows'] = [
		// 	'type' => 'string',
		// 	'message' => 'srf-paramdesc-carousel-slick-option',
		// 	'default' => '$(element)',
		// ];

		// $params['slick-appendDots'] = [
		// 	'type' => 'string',
		// 	'message' => 'srf-paramdesc-carousel-slick-option',
		// 	'default' => '$(element)',
		// ];

		'slick-arrows' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],

		// $params['slick-asNavFor'] = [
		// 	'type' => 'string',
		// 	'message' => 'srf-paramdesc-carousel-slick-option',
		// 	'default' => '$(element)',
		// ];

		'slick-autoplay' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-autoplaySpeed' => [
			'type' => 'integer',
			'required' => false,
			'default' => 3000,
		],
		'slick-centerMode' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-centerPadding' => [
			'type' => 'string',
			'required' => false,
			'default' => '50px',
		],
		'slick-cssEase' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ease',
		],
		// $params['slick-customPaging'] = [
		//	'message' => 'srf-paramdesc-carousel-slick-option',
		//	'default' => '',
		// ];

		'slick-dots' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-dotsClass' => [
			'type' => 'string',
			'required' => false,
			'default' => 'slick-dots',
		],
		'slick-draggable' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-easing' => [
			'type' => 'string',
			'required' => false,
			'default' => 'linear',
		],
		'slick-edgeFriction' => [
			'type' => 'integer',
			'required' => false,
			'default' => 0.15,
		],
		'slick-fade' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false
		],
		'slick-focusOnSelect' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false
		],
		'slick-focusOnChange' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false
		],
		'slick-infinite' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true
		],
		'slick-initialSlide' => [
			'type' => 'integer',
			'required' => false,
			'default' => 0
		],
		'slick-lazyLoad' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ondemand'
		],
		'slick-mobileFirst' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-nextArrow' => [
			'type' => 'string',
			'required' => false,
			'default' => '<button type="button" class="slick-next">Next</button>',
		],
		'slick-pauseOnDotsHover' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-pauseOnFocus' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-pauseOnHover' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-prevArrow' => [
			'type' => 'string',
			'required' => false,
			'default' => '<button type="button" class="slick-prev">Previous</button>',
		],
		'slick-respondTo' => [
			'type' => 'string',
			'required' => false,
			'default' => 'window',
		],

		// @see https://github.com/kenwheeler/slick/#responsive-option-example
		// $params['slick-responsive'] = [
		// 	'type' => 'string',
		//  	'message' => 'srf-paramdesc-carousel-slick-option',
		//  	'default' => null,
		// ];

		'slick-rows' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1
		],
		'slick-rtl' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-slide' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'slick-slidesPerRow' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1,
		],
		'slick-slidesToScroll' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1,
		],
		'slick-slidesToShow' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1,
		],
		'slick-speed' => [
			'type' => 'integer',
			'required' => false,
			'default' => 300,
		],
		'slick-swipe' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-swipeToSlide' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-touchMove' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-touchThreshold' => [
			'type' => 'integer',
			'required' => false,
			'default' => 5,
		],
		'slick-useCSS' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-useTransform' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-variableWidth' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-vertical' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-verticalSwiping' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'slick-waitForAnimate' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slick-zIndex' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1000,
		],

		// custom parameter
		'slick-enable-lazyLoad-after' => [
			'type' => 'integer',
			'required' => false,
			'default' => 10,
		],
	];

	public function isHtml() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		$results = $this->queryProcessor->getResultsTree();
		if ( count( $this->queryProcessorErrors() ) ) {
			return implode( ', ', $this->queryProcessorErrors() );
		}
		if ( $this->params['debug'] ) {
			return $results;
		}
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @inheritDoc
	 */
	public function processResults( $results, $schema ) {
		$this->mapProperties = [
			$this->params['file-property'] => 'file',
			$this->params['title-property'] => 'title',
			$this->params['caption-property'] => 'caption',
			$this->params['link-property'] => 'link',
		];

		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			if ( $title_->isSpecial( 'Badtitle' ) ) {
				continue;
			}
			// @TODO implement file value from mainlabel
			$ret[] = $this->processRowTree( $title_, $row, $categories );
		}

		return $this->processRoot( $ret );
	}

	/**
	 * @inheritDoc
	 */
	public function processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast ) {
		return '';
	}

	/**
	 * @inheritDoc
	 */
	public function processChild( $title, $schema, $key, $properties, $categories, $path, $isArray, $isFirst, $isLast ) {
		if ( array_key_exists( $key, $this->mapProperties ) ) {
			if ( $this->mapProperties[$key] === 'file' ) {
				$this->obj[$this->mapProperties[$key]][] = [ $title, (string)$properties[$key] ];
			} else {
				$this->obj[$this->mapProperties[$key]][] = (string)$properties[$key];
			}
		}
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		if ( empty( $this->obj['file'] ) ) {
			return 'no images found or identified';
		}
		$arr = [];
		foreach ( $this->obj['file'] as $key => $value ) {
			[ $title, $file ] = $value;
			$arr[] = [
				'title' => $title,
				'file' => $file,
				'titleValue' => ( isset( $this->obj['title'] ) ? $this->obj['title'][$key] : '' ),
				'caption' => ( isset( $this->obj['caption'] ) ? $this->obj['caption'][$key] : '' ),
				'link' => ( isset( $this->obj['link'] ) ? $this->obj['link'][$key] : '' ),
			];
		}

		$this->modules[] = 'ext.VisualData.Slick';
		// *** not working MW 1.41.0
		// $this->output->addModules( [ 'ext.VisualData.Slick' ] );

		// @see https://github.com/SemanticMediaWiki/SemanticResultFormats/blob/master/formats/carousel/Carousel.php
		$inlineStyles = $this->getInlineStyles();
		$items = [];

		$n = 0;
		foreach ( $arr as $value ) {
			[ $fileTitleStr, $imageUrl ] = $this->getImageTitleAndUrl( $value['file'] );
			$titleValue = $value['titleValue'];
			$captionValue = $value['caption'];
			$linkValue = $value['link'];

			if ( !empty( $captionValue ) ) {
				$captionValue = Parser::stripOuterParagraph(
					$this->parser->recursiveTagParseFully( $captionValue )
				);
			}

			if ( !empty( $linkValue ) && !filter_var( $linkValue, FILTER_VALIDATE_URL ) ) {
				$linkValue = Parser::stripOuterParagraph(
					$this->parser->recursiveTagParseFully( $linkValue )
				);
			}

			$imgAttr = [
				'alt' => ( $titleValue ?? $captionValue ? strip_tags( $captionValue ) : $fileTitleStr ),
				'class' => 'slick-slide-content img'
			];

			if ( !empty( $inlineStyles['img'] ) ) {
				$imgAttr['style'] = $inlineStyles['img'];
			}

			// @see https://kenwheeler.github.io/slick/
			if ( $n < $this->params['slick-enable-lazyLoad-after'] ) {
				$imgAttr['src'] = $imageUrl;

			} else {
				$imgAttr['src'] = $GLOBALS['wgExtensionAssetsPath'] . '/VisualData/resources/1x1.png';
				$imgAttr['data-lazy'] = $imageUrl;
			}

			$innerContent = HtmlClass::rawElement( 'img', $imgAttr );

			if ( $titleValue || $captionValue ) {
				$innerContent .= HtmlClass::rawElement( 'div', [ 'class' => 'slick-slide-content caption' ],
					( $titleValue ? HtmlClass::rawElement( 'div', [ 'class' => 'slick-slide-content caption-title' ], $titleValue ) : '' )
					. ( $captionValue ? HtmlClass::rawElement( 'div', [ 'class' => 'slick-slide-content caption-text' ], $captionValue ) : '' )
				);
			}

			$items[] = HtmlClass::rawElement(
				'div',
				[
					'class' => 'slick-slide',
					'data-url' => $linkValue,
					'style' => $inlineStyles['slide']
				],
				$innerContent
			);

			$n++;
		}

		$attr = [ 'class' => 'slick-slider' . ( empty( $this->params['class'] ) ? '' : ' ' . $this->params['class'] ) ];

		if ( !empty( $inlineStyles['container'] ) ) {
			$attr['style'] = $inlineStyles['container'];
		}

		$slick_attr = [];
		foreach ( $this->params as $key => $value ) {
			if ( strpos( $key, 'slick-' ) === 0 ) {
				$slick_attr[ str_replace( 'slick-', '', $key ) ] = $value;
			}
		}

		$attr['data-slick'] = json_encode( $slick_attr );

		return HtmlClass::rawElement(
			'div',
			$attr,
			implode( $items )
		);
	}

	/**
	 * @return array
	 */
	private function getInlineStyles() {
		if ( empty( $this->params['width'] ) ) {
			$this->params['width'] = '100%';
		}

		// set to hidden and show onload to prevent layout disarray
		// @TODO show spinner
		$img = [ 'display' => 'display:none', 'object-fit' => 'object-fit: cover' ];
		$container = [];
		$slide = [];

		// avoid using '/^(\d+)(.+)?$/' per https://phabricator.wikimedia.org/T387008
		preg_match( '/^(\d+)(.*)$/', $this->params['width'], $match );

		$absoluteUnits = [ 'cm', 'mm', 'in', 'px', 'pt', 'pc' ];
		$slidestoshow = $this->params['slick-slidesToShow'];

		// @see https://github.com/SemanticMediaWiki/SemanticResultFormats/issues/784
		if ( !empty( $slidestoshow ) && is_int( $slidestoshow ) && !empty( $match[1] ) ) {
			if ( empty( $match[2] ) ) {
				$match[2] = 'px';
			}
			$img['max-width'] = 'max-width:' . ( in_array( $match[2], $absoluteUnits ) ?
				( $match[1] / $slidestoshow ) . $match[2]
				: '100%' );
		}

		$styleAttr = [ 'width', 'height' ];
		foreach ( $styleAttr as $attr ) {
			if ( !empty( $this->params[$attr] ) ) {
				$container[ $attr ] = "$attr: " . $this->params[$attr];

				// *** use css inherit attribute instead
				// $slide[$attr] = "$attr: " . $this->params[$attr];
			}
		}

		return [
			'container' => implode( '; ', $container ),
			'img' => implode( '; ', $img ),
			'slide' => implode( '; ', $slide )
		];
	}

	/**
	 * @param array $value
	 * @return array
	 */
	protected function getImageTitleAndUrl( $value ) {
		$title = TitleClass::newFromText( $value, NS_FILE );

		if ( !$title ) {
			return [ '', '' ];
		}

		$wikiFilePage = new \WikiFilePage( $title );
		$file = $wikiFilePage->getFile();

		if ( !$file ) {
			return [ $title->getText(), '' ];
		}

		return [ $title->getText(), $file->getUrl() ];
	}

}
