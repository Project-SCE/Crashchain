import React from 'react';
import styled from 'styled-components';

const Card = ({ title, frontText, backText, githubLink, linkedinLink }) => {
  return (
    <StyledWrapper>
      <div className="flip-card">
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <p className="title">{title}</p> {/* Using the title prop */}
            <p>{frontText}</p> {/* Using the frontText prop */}
          </div>
          <div className="flip-card-back">
            <p className="back-text">{backText}</p> {/* Add this line for backText with smaller font */}
            {/* Using the backText prop */}
            {/* Social media links */}
            <div className="flex justify-center mt-4">
              <a href={githubLink}>
                <img
                  src="src/assets/github.png"
                  alt="github"
                  width="40"
                  height="40"
                  className="mx-2"
                />
              </a>
              <a href={linkedinLink}>
                <img
                  src="src/assets/image.png"
                  alt="linkedin"
                  width="40"
                  height="40"
                  className="mx-2"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};



const StyledWrapper = styled.div`
  .flip-card {
    background-color: transparent;
    width: 190px;
    height: 254px;
    perspective: 1000px;
    font-family: sans-serif;
  }

  .title {
    font-size: 1.5em;
    font-weight: 900;
    text-align: center;
    margin: 0;
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }
  .flip-card-back .back-text {
  font-size: 0.9em;  /* Adjust this value as needed to make the font smaller */
  color: white;      /* Make sure text color is visible against the background */
}
  .flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
  }

  .flip-card-front, .flip-card-back {
    box-shadow: 0 8px 14px 0 rgba(0,0,0,0.2);
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border: 1px solid black;
    border-radius: 1rem;
  }

.flip-card-front {
    background: linear-gradient(120deg, #6C63FF 60%, #4B42C6 88%, 
        #3A35A3 40%, #8978FF 48%);
    color: white;
}

.flip-card-back {
    background: linear-gradient(120deg, #6C63FF 20%, #4F46E5 40%, 
        #3A35A3 60%, #8978FF 80%,rgb(156, 147, 239) 100%);
    color: white;
    transform: rotateY(180deg);
}`;

export default Card;
