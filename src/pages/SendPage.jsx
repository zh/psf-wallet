import MobileLayout from '../components/Layout/MobileLayout';
import SendBCH from '../components/SendBCH';

const SendPage = () => {
  return (
    <MobileLayout title="Send">
      <div className="send-content">
        <SendBCH />
      </div>
    </MobileLayout>
  );
};

export default SendPage;