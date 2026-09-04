"""Legacy command-line interface backed by the canonical V3 risk engine."""

from risk_engine import predict_risk


def main() -> None:
    latitude = float(input("Enter latitude: "))
    longitude = float(input("Enter longitude: "))
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("Coordinates are outside valid latitude/longitude ranges")
    result = predict_risk(latitude, longitude)
    print(f"Experimental risk probability: {result['risk_probability']:.2f}%")
    print(result["disclaimer"])
    print("Leading model contributions:")
    for driver in result["drivers"]:
        print(
            f" - {driver['feature']}: {driver['value']} "
            f"({driver['direction']} risk contribution)"
        )


if __name__ == "__main__":
    main()
