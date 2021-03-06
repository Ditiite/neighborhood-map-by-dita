import { Map, InfoWindow, Marker } from "google-maps-react";
import React, { Component } from "react";
import { markers as defaultMarkers } from "../markers/markers";
import Sidebar from "./Sidebar";
import { styles } from "./MapContainer.styles";
import { Header } from "./Header";
import { getWeather } from "../services/weatherApi";
import weatherLogo from "../images/openweathermap.png";
import PropTypes from "prop-types";
import { Weather } from "./Weather";

class MapContainer extends Component {
  state = {
    showingInfoWindow: true,
    activeMarker: null,
    selectedPlace: {},
    initialCenter: {
      lat: 56.949649,
      lng: 24.105186
    },
    show: true,
    btnText: "Hide",
    markers: [...defaultMarkers],
    filteredmarkers: [...defaultMarkers],
    activeMarkerWeather: null,
    errMsg: null
  };

  selectMarkerByTitle = title => {
    const markerEl = document.querySelector(`[title='${title}']`);
    markerEl.focus();
    markerEl.click();
  };

  onMarkerClick = async (props, marker, e, err) => {
    let weatherErrMsg = "";
    let activeMarkerWeather = null;

    try {
      activeMarkerWeather = await getWeather(
        marker.position.lat(),
        marker.position.lng()
      );
    } catch (err) {
      weatherErrMsg = "Sorry, can't get weather data from openWeatherAPI.";
      console.error("Failed to fetch weather");
    }
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true,
      initialCenter: marker.position,
      activeMarkerWeather,
      weatherErrMsg
    });

    marker.setAnimation(this.props.google.maps.Animation.BOUNCE);
    setTimeout(() => {
      marker.setAnimation(null);
    }, 2000);
  };

  /**
   * Show user error
   */
  alertError = errMsg => {
    this.setState({
      errMsg: errMsg
    });
    setTimeout(() => {
      this.setState({
        errMsg: ""
      });
    }, 7000);
  };
  /**
   * Reset activeMarker, infoWindow when outside the marker is clicked
   */
  onMapClicked = () => {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null
      });
    }
  };

  /**
   * set new markers to our state
   * refresh the filter list with main one
   * @param {Object} marker
   */
  updateMarkers = markers => {
    this.setState({
      markers: [...markers],
      filteredmarkers: [...markers]
    });
  };

  updateFilteredMarkers = filteredmarkers => {
    //console.log("Updated filtered list", filteredmarkers);
    this.setState({
      filteredmarkers: [...filteredmarkers]
    });
  };

  /* TOOGLE THE BUTTON TO SHOW OR HIDE SIDEBAR */
  handleShow = () => {
    this.setState({
      show: !this.state.show
    });
    if (this.state.btnText === "Hide") {
      this.setState({
        btnText: "Show more"
      });
    } else if (this.state.btnText === "Show more") {
      this.setState({
        btnText: "Hide"
      });
    }
  };

  render() {
    let animation = this.props.google.maps.Animation.DROP;

    const filteredmarkers = this.state.filteredmarkers;

    let bounds = new this.props.google.maps.LatLngBounds();
    this.state.markers.forEach(marker => {
      bounds.extend(marker.position);
    });

    //customize icon
    const markerColor = "f70909";
    const icons =
      "http://chart.googleapis.com/chart?chst=d_map_spin&chld=0.6|0|" +
      markerColor +
      "|10|_|%E2%80%A2";

    return (
      <React.Fragment>
        <Header btnText={this.state.btnText} handleShow={this.handleShow} />

        {this.state.errMsg && (
          <div className="alert alert-error">{this.state.errMsg}</div>
        )}
        {this.state.show && (
          <Sidebar
            google={this.props.google}
            selectMarkerByTitle={this.selectMarkerByTitle}
            showInfoWindow={this.showInfoWindow}
            markers={this.state.markers}
            filteredmarkers={this.state.filteredmarkers}
            updateMarkers={this.updateMarkers}
            updateFilteredMarkers={this.updateFilteredMarkers}
            alertError={this.alertError}
          />
        )}
        <div className="map">
          <Map
            aria-label="location"
            role="application"
            styles={styles}
            google={this.props.google}
            initialCenter={this.state.initialCenter}
            center={
              this.state.activeMarker ? this.state.activeMarker.position : {}
            }
            zoom={7}
            onClick={this.onMapClicked}
            bounds={bounds}
          >
            {filteredmarkers.map((mark, i) => {
              return (
                <Marker
                  aria-label="Marker of location"
                  onClick={this.onMarkerClick}
                  key={i}
                  name={mark.name}
                  title={mark.title}
                  position={mark.position}
                  animation={animation}
                  icon={icons}
                />
              );
            })}

            <InfoWindow
              aria-label="Info about location"
              marker={this.state.activeMarker}
              visible={this.state.showingInfoWindow}
            >
              <div className="info-window" tabIndex="-1">
                <h2>{this.state.selectedPlace.name}</h2>
                <p className="address">{this.state.selectedPlace.title}</p>
                {this.state.activeMarkerWeather ? (
                  <Weather
                    src={this.state.activeMarkerWeather.weatherIcon}
                    description={this.state.activeMarkerWeather.description}
                    temp={this.state.activeMarkerWeather.temp}
                    imgSrc={weatherLogo}
                  />
                ) : (
                  <div>{this.state.weatherErrMsg}</div>
                )}
              </div>
            </InfoWindow>
          </Map>
        </div>
      </React.Fragment>
    );
  }
}

MapContainer.propTypes = {
  google: PropTypes.object,
  LatLngBounds: PropTypes.func
};

export default MapContainer;
