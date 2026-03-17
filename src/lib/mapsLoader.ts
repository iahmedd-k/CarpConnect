export const loadGoogleMaps = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.google) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

export const decodePolyline = (encoded: string) => {
    if (!window.google) return [];
    return window.google.maps.geometry.encoding.decodePath(encoded);
};
