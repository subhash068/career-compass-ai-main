import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sobre Nós</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Somos uma plataforma dedicada a ajudar profissionais a identificarem suas lacunas de habilidades e desenvolverem carreiras de sucesso.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'var(--primary-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '90px',
              height: '90px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(41, 80, 148, 0.3)'
            }}
          >
            Início
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
