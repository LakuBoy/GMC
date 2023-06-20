import axios from 'axios';

const url = 'https://travel-advisor.p.rapidapi.com/restaurants/list-in-boundary';

export const getPlacesData = async (type, sw, ne) => {
    try {
        const {
            data: {data },
        } = await axios.get(`https://travel-advisor.p.rapidapi.com/${type}/list-in-boundary`, {
          params: {
            bl_latitude: sw.lat,
            tr_latitude: ne.lat,
            bl_longitude: sw.lng,
            tr_longitude: ne.lng,
          },
          headers: {
            'X-RapidAPI-Key': 'deded6d837msh7b324ecdc2bf66ep1a0599jsnad079a078554',
            'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
          },

        });
        return data;
    } catch (error) {
        console.log(`Fetch data Error : ${error}`);
    }
};
 
