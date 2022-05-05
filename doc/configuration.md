# Configuration reference

The [configuration file](../src/app/config-dist.json) is used to set up the map layers, application-specific data and interaction options.

- **`baseLayers`** Background maps. See [ol-cityscope](https://github.com/citysciencelab/ol-cityscope) for detailed documentation
- **`topicLayers`** Thematic maps and (necessarily) the dataset containing the portfolio of available locations. See [ol-cityscope](https://github.com/citysciencelab/ol-cityscope) for detailed documentation
- **`progressMarkerID`** If TUIO objects are used, the ID of the progress marker object
- **`selectionMarkerID`** If TUIO objects are used, the ID of the selection marker object
- **`searchCriteria`** Array of criteria used to evaluate the location options. Values for each of these criteria, for each location, must be contained in the portfolio dataset defined in `topicLayers`. Properties per item:
  - **`key`** Value accessor
  - **`name_en-US`** English name of the criterion
  - **`name_de-DE`** German name of the criterion
  - **`color`** Color used to visualize the criterion
  - **`markerID`** If TUIO objects are used, the ID of the marker object used to adjust that criterion
- **`enableTuio`** Whether the system operates with the TUIO protocol
- **`tuioCursorEvents`** If TUIO is enabled, whether TUIO cursor messages shall be interpreted as touch events
