import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import NetworkStatus from '../NetworkStatus';

const TopBar = ({ title }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const showBackButton = location.pathname !== '/';

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="top-bar">
      <div className="top-bar-content">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="back-button"
            aria-label="Go back"
          >
            Back
          </button>
        )}
        <h1 className="page-title">{title}</h1>
        <div className="top-bar-spacer">
          <NetworkStatus compact={true} />
        </div>
      </div>
    </div>
  );
};

TopBar.propTypes = {
  title: PropTypes.string.isRequired
};

export default TopBar;