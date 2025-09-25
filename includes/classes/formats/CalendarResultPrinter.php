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
 * @copyright Copyright ©2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use MediaWiki\Extension\VisualData\Aliases\Html as HtmlClass;
use MediaWiki\Extension\VisualData\Aliases\Linker as LinkerClass;
use MediaWiki\Extension\VisualData\ResultPrinter;
use MediaWiki\Extension\VisualData\Utils\DateParser;

class CalendarResultPrinter extends ResultPrinter {

	/** @var array */
	private $json = [];

	/** @var array */
	private $mapProperties = [];

	/** @var array */
	public static $parameters = [
		// @see https://github.com/vkurko/calendar/tree/master?tab=readme-ov-file#options
		'allDayContent' => [
			'type' => 'string',
			'required' => false,
			'default' => 'all-day',
		],
		'allDaySlot' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'buttonText.close' => [
			'type' => 'string',
			'required' => false,
			'default' => 'Close',
		],
		'buttonText.dayGridMonth' => [
			'type' => 'string',
			'required' => false,
			'default' => 'month',
		],
		'buttonText.listDay' => [
			'type' => 'string',
			'required' => false,
			'default' => 'list',
		],
		'buttonText.listMonth' => [
			'type' => 'string',
			'required' => false,
			'default' => 'list',
		],
		'buttonText.listWeek' => [
			'type' => 'string',
			'required' => false,
			'default' => 'list',
		],
		'buttonText.listYear' => [
			'type' => 'string',
			'required' => false,
			'default' => 'list',
		],
		'buttonText.resourceTimeGridDay' => [
			'type' => 'string',
			'required' => false,
			'default' => 'resources',
		],
		'buttonText.resourceTimeGridWeek' => [
			'type' => 'string',
			'required' => false,
			'default' => 'resources',
		],
		'buttonText.resourceTimelineDay' => [
			'type' => 'string',
			'required' => false,
			'default' => 'timeline',
		],
		'buttonText.resourceTimelineMonth' => [
			'type' => 'string',
			'required' => false,
			'default' => 'timeline',
		],
		'buttonText.resourceTimelineWeek' => [
			'type' => 'string',
			'required' => false,
			'default' => 'timeline',
		],
		'buttonText.timeGridDay' => [
			'type' => 'string',
			'required' => false,
			'default' => 'day',
		],
		'buttonText.timeGridWeek' => [
			'type' => 'string',
			'required' => false,
			'default' => 'week',
		],
		'buttonText.today' => [
			'type' => 'string',
			'required' => false,
			'default' => 'today',
		],
		'date' => [
			'type' => 'string',
			'required' => false,
			// new Date()
			'default' => '',
		],
		'datesAboveResources' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'dayCellFormat.day' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'dayHeaderAriaLabelFormat.dateStyle' => [
			'type' => 'string',
			'required' => false,
			'default' => 'long',
		],
		'dayHeaderFormat.weekday' => [
			'type' => 'string',
			'required' => false,
			'default' => 'short',
		],
		'dayHeaderFormat.month' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'dayHeaderFormat.day' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'dayMaxEvents' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'dayPopoverFormat.month' => [
			'type' => 'string',
			'required' => false,
			'default' => 'long',
		],
		'dayPopoverFormat.day' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'dayPopoverFormat.year' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'displayEventEnd' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'dragScroll' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'duration.weeks' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1,
		],
		'editable' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'eventBackgroundColor' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'eventClassNames' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'eventColor' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'eventContent' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'eventDragMinDistance' => [
			'type' => 'integer',
			'required' => false,
			'default' => 5,
		],
		'eventDurationEditable' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'eventLongPressDelay' => [
			'type' => 'integer',
			'required' => false,
			'default' => true,
		],
		'eventResizableFromStart' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'eventStartEditable' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'eventTimeFormat.hour' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'eventTimeFormat.minute' => [
			'type' => 'string',
			'required' => false,
			'default' => '2-digit',
		],
		'eventTextColor' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'filterEventsWithResources' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'filterResourcesWithEvents' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'firstDay' => [
			'type' => 'integer',
			'required' => false,
			'default' => 0,
		],
		'flexibleSlotTimeLimits' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		'headerToolbar.start' => [
			'type' => 'string',
			'required' => false,
			// 'default' => 'title',
			// @see https://vkurko.github.io/calendar/
			'default' => 'prev,next today',
		],
		'headerToolbar.center' => [
			'type' => 'string',
			'required' => false,
			// 'default' => '',
			// @see https://vkurko.github.io/calendar/
			'default' => 'title',
		],
		'headerToolbar.end' => [
			'type' => 'string',
			'required' => false,
			// 'default' => 'today prev,next',
			// @see https://vkurko.github.io/calendar/
			'default' => 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
		],
		'height' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'hiddenDays' => [
			'type' => 'array-string',
			'required' => false,
			'default' => '',
		],
		'highlightedDates' => [
			'type' => 'array-string',
			'required' => false,
			'default' => '',
		],
		'lazyFetching' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'listDayFormat.weekday' => [
			'type' => 'string',
			'required' => false,
			'default' => 'long',
		],
		'listDaySideFormat.year' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'listDaySideFormat.month' => [
			'type' => 'string',
			'required' => false,
			'default' => 'long',
		],
		'listDaySideFormat.day' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'locale' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'longPressDelay' => [
			'type' => 'integer',
			'required' => false,
			'default' => '1000',
		],
		'moreLinkContent' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'noEventsContent' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'nowIndicator' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'pointer' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'resourceLabelContent' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'scrollTime' => [
			'type' => 'string',
			'required' => false,
			'default' => '06:00:00',
		],
		'selectable' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'selectBackgroundColor' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'selectLongPressDelay' => [
			'type' => 'integer',
			'required' => false,
			'default' => '',
		],
		'selectMinDistance' => [
			'type' => 'integer',
			'required' => false,
			'default' => 5,
		],
		'slotDuration' => [
			'type' => 'string',
			'required' => false,
			'default' => '00:30:00',
		],
		'slotEventOverlap' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'slotHeight' => [
			'type' => 'integer',
			'required' => false,
			'default' => 24,
		],
		'slotLabelFormat.hour' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'slotLabelFormat.minute' => [
			'type' => 'string',
			'required' => false,
			'default' => '2-digit',
		],
		'slotLabelInterval' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'slotMaxTime' => [
			'type' => 'string',
			'required' => false,
			'default' => '24:00:00',
		],
		'slotMinTime' => [
			'type' => 'string',
			'required' => false,
			'default' => '00:00:00',
		],
		'slotWidth' => [
			'type' => 'integer',
			'required' => false,
			'default' => 72,
		],
		'theme.allDay' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-all-day',
		],
		'theme.active' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-active',
		],
		'theme.bgEvent' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-bg-event',
		],
		'theme.bgEvents' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-bg-events',
		],
		'theme.body' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-body',
		],
		'theme.button' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-button',
		],
		'theme.buttonGroup' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-button-group',
		],
		'theme.calendar' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec',
		],
		'theme.container' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-container',
		],
		'theme.content' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-content',
		],
		'theme.day' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-day',
		],
		'theme.dayHead' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-day-head',
		],
		'theme.dayFoot' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-day-foot',
		],
		'theme.days' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-days',
		],
		'theme.daySide' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-day-side',
		],
		'theme.draggable' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-draggable',
		],
		'theme.dragging' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-dragging',
		],
		'theme.event' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-event',
		],
		'theme.eventBody' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-event-body',
		],
		'theme.eventTag' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-event-tag',
		],
		'theme.eventTime' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-event-time',
		],
		'theme.eventTitle' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-event-title',
		],
		'theme.events' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-events',
		],
		'theme.expander' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-expander',
		],
		'theme.extra' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-extra',
		],
		'theme.ghost' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-ghost',
		],
		'theme.handle' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-handle',
		],
		'theme.header' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-header',
		],
		'theme.hiddenScroll' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-hidden-scroll',
		],
		'theme.highlight' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-highlight',
		],
		'theme.icon' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-icon',
		],
		'theme.line' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-line',
		],
		'theme.lines' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-lines',
		],
		'theme.main' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-main',
		],
		'theme.minor' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-minor',
		],
		'theme.noEvents' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-no-events',
		],
		'theme.nowIndicator' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-now-indicator',
		],
		'theme.otherMonth' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-other-month',
		],
		'theme.pointer' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-pointer',
		],
		'theme.popup' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-popup',
		],
		'theme.preview' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-preview',
		],
		'theme.resizer' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-resizer',
		],
		'theme.resizingX' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-resizing-x',
		],
		'theme.resizingY' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-resizing-y',
		],
		'theme.resource' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-resource',
		],
		'theme.selecting' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-selecting',
		],
		'theme.sidebar' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-sidebar',
		],
		'theme.sidebarTitle' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-sidebar-title',
		],
		'theme.today' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-today',
		],
		'theme.time' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-time',
		],
		'theme.times' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-times',
		],
		'theme.title' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-title',
		],
		'theme.toolbar' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-toolbar',
		],
		'theme.view' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-timeline ec-resource-week-view',
		],
		'theme.weekdays' => [
			'type' => 'array',
			'required' => false,
			'default' => 'ec-sun, ec-mon, ec-tue, ec-wed, ec-thu, ec-fri, ec-sat',
		],
		'theme.withScroll' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-with-scroll',
		],
		'theme.uniform' => [
			'type' => 'string',
			'required' => false,
			'default' => 'ec-uniform',
		],

		'titleFormat.year' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],
		'titleFormat.month' => [
			'type' => 'string',
			'required' => false,
			'default' => 'short',
		],
		'titleFormat.day' => [
			'type' => 'string',
			'required' => false,
			'default' => 'numeric',
		],

		'unselectAuto' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'unselectCancel' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'validRange.start' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'validRange.end' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],

		// any of 'dayGridMonth', 'listDay', 'listWeek', 'listMonth', 'listYear', 'resourceTimeGridDay', 'resourceTimeGridWeek', 'resourceTimelineDay', 'resourceTimelineWeek', 'resourceTimelineMonth', 'timeGridDay' or 'timeGridWeek'
		'view' => [
			'type' => 'string',
			'required' => false,
			// 'default' => 'resourceTimeGridWeek',
			'default' => 'timeGridWeek',
		],
		'weekNumberContent' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'weekNumbers' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		// custom parameters
		'simple' => [
			'type' => 'boolean',
			'required' => false,
			// if true it uses (EventCalendar default)
			// headerToolbar.start = title
			// headerToolbar.center =
			// headerToolbar.end = today prev,next
			// otherwise:
			// headerToolbar.start = prev,next today
			// headerToolbar.center = title
			// headerToolbar.end = dayGridMonth,timeGridWeek,timeGridDay,listWeek
			'default' => false,
		],
		// @see https://github.com/vkurko/calendar?tab=readme-ov-file#event-object
		'start-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'start',
		],
		'end-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'end',
		],
		'title-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'title',
		],
		'resources-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'resources',
		],
		'allday-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'allDay',
		],
		'display-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'display',
		],
		'backgroundcolor-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'backgroundColor',
		],
		'textcolor-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'textColor',
		],
		'classnames-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'classNames',
		],
		'styles-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'styles',
		],

		'height' => [
			'type' => 'string',
			'required' => false,
			'default' => 'auto',
		],
		'width' => [
			'type' => 'string',
			'required' => false,
			'default' => '100%',
		],
		'duration-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'duration',
		],
		'default-event-duration' => [
			'type' => 'int',
			'required' => false,
			'default' => 60,
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
		$errors = $this->queryProcessorErrors();
		if ( count( $errors ) === 1 && $errors[0] === 'schema has no data' ) {
			$errors = [];
		}
		if ( count( $errors ) ) {
			return implode( ', ', $errors );
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
		foreach ( [
			'start-property',
			'end-property',
			'title-property',
			'resources-property',
			'duration-property',
			'allday-property',
			'display-property',
			'backgroundcolor-property',
			'textcolor-property',
			'classnames-property',
			'styles-property',
		] as $property ) {
			$this->mapProperties[ self::$parameters[$property]['default'] ] = $this->params[$property];
		}

		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			if ( $title_->isSpecial( 'Badtitle' ) ) {
				continue;
			}
			$ret[] = $this->processRowTree( $title_, $row, $categories );
		}

		return $this->processRoot( $ret );
	}

	/**
	 * @inheritDoc
	 */
	public function processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast ) {
		// $value = parent::processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast );

		if ( isset( $properties[ $this->mapProperties['start'] ] ) ) {
			$properties_ = [];
			foreach ( $this->mapProperties as $key_ => $value_ ) {
				if ( isset( $properties[ $value_ ] ) ) {
					$properties_[$key_] = $properties[ $value_ ];
				}
			}

			$formatted = LinkerClass::link( $title, $title->getFullText() );
			$this->json[] = [
				$formatted,
				$properties_
			];
		}

		return $properties;
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		if ( $this->params['simple'] === true ) {
			$found_ = false;
			foreach ( [	'headerToolbar.start', 'headerToolbar.center', 'headerToolbar.end' ] as $key_ ) {
				if ( $this->params[$key_] !== self::$parameters[$key_]['default'] ) {
					$found_ = true;
					break;
				}
			}
			if ( !$found_ ) {
				// use  https://vkurko.github.io/calendar/ defaults
				// if "simple" is false (default) and those parameters are not changed
				$this->params['headerToolbar.start'] = 'title';
				$this->params['headerToolbar.center'] = '';
				$this->params['headerToolbar.end'] = 'today prev,next';
			}
		}

		$params = $this->getFormattedParams();
		$this->modules[] = 'ext.VisualData.Calendar';

		if ( empty( $params['date'] ) ) {
			$params['date'] = time();

		} else {
			$dateParser = new DateParser( $params['date'] );
			// timestamp
			$params['date'] = $dateParser->parse();
		}

		if ( empty( $params['locale'] ) ) {
			$context = \RequestContext::getMain();
			$params['locale'] = $context->getLanguage()->getCode();
		}

		return HtmlClass::rawElement(
			'div',
			[
				'style' => 'width:' . $this->params['width'] . ';height:' . $this->params['height'],
				'class' => 'visualdata-calendar',
				'data-json' => json_encode( $this->json ),
				'data-params' => json_encode( $params ),
				'width' => $this->params['width'],
				'height' => $this->params['height'],
			],
			wfMessage( 'visualdata-resultprinter-calendar-placeholder' )->text()
		);
	}

}
