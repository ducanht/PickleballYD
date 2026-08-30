import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GroupDrawPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/tournaments/${id}/draw`, { replace: true });
    }
  }, [id, navigate]);

  return null;
}
