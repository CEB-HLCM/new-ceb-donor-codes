import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import { Link } from 'react-router-dom';
import searchImage from '../assets/images/search_768.png';
import addImage from '../assets/images/add_768.png';
import donorsImage from '../assets/images/duty_stations_768.png';
import requestsImage from '../assets/images/requests_768.png';

const HomePage: React.FC = () => {
  const menuCards = [
    {
      title: 'Search',
      description: 'Search for donor codes and information',
      image: searchImage,
      path: '/search',
    },
    {
      title: 'Add Donor',
      description: 'Request a new donor code',
      image: addImage,
      path: '/donor-request',
    },
    {
      title: 'Donors List',
      description: 'Browse all donor codes',
      image: donorsImage,
      path: '/donors',
    },
    {
      title: 'Requests',
      description: 'View your pending requests',
      image: requestsImage,
      path: '/requests-list',
    },
  ];

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontFamily: 'arial, sans-serif',
          mb: 6 
        }}
      >
        CEB Donor Codes
      </Typography>
      
      <Grid container spacing={4} justifyContent="center">
        {menuCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                width: 240,
                height: '100%',
                mx: 'auto',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <CardActionArea 
                component={Link} 
                to={card.path}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={card.image}
                  alt={card.title}
                  sx={{ objectFit: 'contain', p: 2 }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
